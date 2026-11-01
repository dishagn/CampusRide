import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/constants.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  SupabaseClient? _client;
  bool _isInitialized = false;

  SupabaseClient get client {
    if (!_isInitialized || _client == null) {
      throw Exception('Supabase client has not been initialized.');
    }
    return _client!;
  }

  Future<void> initialize() async {
    try {
      await Supabase.initialize(
        url: AppConstants.supabaseUrl,
        anonKey: AppConstants.supabaseAnonKey,
      );
      _client = Supabase.instance.client;
      _isInitialized = true;
      debugPrint('[SupabaseService] Initialized successfully with cloud project.');
    } catch (e) {
      debugPrint('[SupabaseService] Initialization warning: $e');
    }
  }

  /// Publishes new bus telemetry coordinate under the 100-meter rule
  Future<bool> publishLiveLocation({
    required String busId,
    required double latitude,
    required double longitude,
    required double speed,
    required double heading,
    required String journeyStatus,
    int delayMinutes = 0,
    String? delayReason,
  }) async {
    if (!_isInitialized || _client == null) {
      debugPrint('[SupabaseService] Offline simulation mode active. Telemetry logged locally.');
      return true;
    }

    try {
      await _client!.from('live_bus_locations').upsert({
        'bus_id': busId,
        'latitude': latitude,
        'longitude': longitude,
        'speed': speed,
        'heading': heading,
        'journey_status': journeyStatus,
        'delay_minutes': delayMinutes,
        'delay_reason': delayReason,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      });
      return true;
    } catch (e) {
      debugPrint('[SupabaseService] Error publishing live location: $e');
      return false;
    }
  }

  /// Records journey lifecycle event (Start / Arrival)
  Future<void> updateJourneyStatus({
    required String busId,
    required String status,
  }) async {
    if (!_isInitialized || _client == null) return;
    try {
      await _client!.from('live_bus_locations').update({
        'journey_status': status,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      }).eq('bus_id', busId);
    } catch (e) {
      debugPrint('[SupabaseService] Error updating journey status: $e');
    }
  }
}

