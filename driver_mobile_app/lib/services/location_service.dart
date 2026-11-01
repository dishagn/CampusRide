import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../config/constants.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  Position? _lastPublishedPosition;
  StreamSubscription<Position>? _positionStreamSubscription;

  // Callback whenever 100m threshold is satisfied
  Function(Position position, double distanceDelta)? onPublishedPosition;

  Position? get lastPublishedPosition => _lastPublishedPosition;

  /// Haversine Great-Circle Distance calculation between two points in meters
  static double calculateHaversineDistanceMeters(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const double earthRadiusMeters = 6371e3;
    final double phi1 = lat1 * (math.pi / 180.0);
    final double phi2 = lat2 * (math.pi / 180.0);
    final double deltaPhi = (lat2 - lat1) * (math.pi / 180.0);
    final double deltaLambda = (lon2 - lon1) * (math.pi / 180.0);

    final double a = math.sin(deltaPhi / 2) * math.sin(deltaPhi / 2) +
        math.cos(phi1) *
            math.cos(phi2) *
            math.sin(deltaLambda / 2) *
            math.sin(deltaLambda / 2);

    final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  /// Verifies location permissions and GPS hardware availability
  Future<bool> verifyLocationPrerequisites() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('[Driver App] GPS location service is disabled.');
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        debugPrint('[Driver App] Location permission denied by driver.');
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      debugPrint('[Driver App] Location permission permanently denied.');
      return false;
    }

    return true;
  }

  /// Starts continuous native background GPS tracking adhering to the 100-meter delta rule
  Future<void> startTracking({
    required Function(Position position, double distanceDelta) onUpdate,
  }) async {
    onPublishedPosition = onUpdate;

    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 15, // Sensor reads every 15m; software applies 100m threshold filter
    );

    _positionStreamSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen((Position position) {
      _processRawPosition(position);
    });
  }

  void _processRawPosition(Position currentPosition) {
    if (_lastPublishedPosition == null) {
      // First coordinate is published immediately to anchor route start
      _lastPublishedPosition = currentPosition;
      onPublishedPosition?.call(currentPosition, 0.0);
      return;
    }

    // Compute Haversine distance from last published coordinate
    final double distanceDelta = calculateHaversineDistanceMeters(
      _lastPublishedPosition!.latitude,
      _lastPublishedPosition!.longitude,
      currentPosition.latitude,
      currentPosition.longitude,
    );

    // Apply strict 100-meter publication rule
    if (distanceDelta >= AppConstants.movementThresholdMeters) {
      debugPrint(
        '[Driver App] Haversine delta satisfied: ${distanceDelta.toStringAsFixed(1)}m >= 100m. Publishing new telemetry coordinate.',
      );
      _lastPublishedPosition = currentPosition;
      onPublishedPosition?.call(currentPosition, distanceDelta);
    } else {
      debugPrint(
        '[Driver App] Haversine delta: ${distanceDelta.toStringAsFixed(1)}m < 100m. Telemetry update skipped to prevent clutter.',
      );
    }
  }

  /// Stops tracking and releases sensor streams
  Future<void> stopTracking() async {
    await _positionStreamSubscription?.cancel();
    _positionStreamSubscription = null;
    _lastPublishedPosition = null;
    debugPrint('[Driver App] Background GPS tracking stopped.');
  }
}

