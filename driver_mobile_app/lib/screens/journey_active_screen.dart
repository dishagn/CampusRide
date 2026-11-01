import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../config/constants.dart';
import '../services/location_service.dart';
import '../services/supabase_service.dart';

class JourneyActiveScreen extends StatefulWidget {
  final String busId;
  final String busNumber;
  final String vehicleReg;
  final String routeName;
  final List<Map<String, dynamic>> stops;

  const JourneyActiveScreen({
    super.key,
    required this.busId,
    required this.busNumber,
    required this.vehicleReg,
    required this.routeName,
    required this.stops,
  });

  @override
  State<JourneyActiveScreen> createState() => _JourneyActiveScreenState();
}

class _JourneyActiveScreenState extends State<JourneyActiveScreen> {
  final LocationService _locationService = LocationService();
  final SupabaseService _supabaseService = SupabaseService();

  int _currentStopIndex = 2; // Stop 3: Kundalahalli Gate
  double _currentSpeed = 36.5;
  double _lastPublishedDelta = 0.0;
  int _delayMinutes = 0;
  String _delayReason = '';

  // 2-Minute Waiting Timer state
  Timer? _stopWaitTimer;
  int _waitingSecondsRemaining = AppConstants.stopWaitingTimerSeconds;
  bool _isTimerActive = false;

  // Passenger roster for current stop
  final List<Map<String, dynamic>> _currentStopPassengers = [
    {'name': 'Aarav Sharma', 'usn': '1MS21CS045', 'status': PassengerStatus.coming},
    {'name': 'Diya Krishnan', 'usn': '1MS21IS022', 'status': PassengerStatus.coming},
    {'name': 'Vikram Rao', 'usn': '1MS22EE018', 'status': PassengerStatus.notUpdated},
    {'name': 'Neha Gupta', 'usn': '1MS23CS090', 'status': PassengerStatus.absent},
  ];

  @override
  void initState() {
    super.initState();
    _startTelemetryPipeline();
  }

  void _startTelemetryPipeline() {
    _locationService.startTracking(
      onUpdate: (Position pos, double distanceDelta) {
        setState(() {
          _currentSpeed = pos.speed * 3.6; // convert m/s to km/h
          _lastPublishedDelta = distanceDelta;
        });

        // Publish to Supabase
        _supabaseService.publishLiveLocation(
          busId: widget.busId,
          latitude: pos.latitude,
          longitude: pos.longitude,
          speed: _currentSpeed,
          heading: pos.heading,
          journeyStatus: 'IN_TRANSIT',
          delayMinutes: _delayMinutes,
          delayReason: _delayReason.isNotEmpty ? _delayReason : null,
        );
      },
    );
  }

  /// Triggers arrival at Stop N: activates mandatory 2-minute timer if "NOT UPDATED" passengers exist
  void _handleArriveAtStop() {
    final bool hasNotUpdatedPassengers = _currentStopPassengers.any(
      (p) => p['status'] == PassengerStatus.notUpdated,
    );

    if (hasNotUpdatedPassengers) {
      setState(() {
        _isTimerActive = true;
        _waitingSecondsRemaining = AppConstants.stopWaitingTimerSeconds;
      });

      _stopWaitTimer?.cancel();
      _stopWaitTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (_waitingSecondsRemaining > 0) {
          setState(() => _waitingSecondsRemaining--);
        } else {
          timer.cancel();
          setState(() => _isTimerActive = false);
          _showToast('Mandatory 2-minute waiting timer elapsed. Ready to depart.');
        }
      });
    } else {
      _showToast('All passengers confirmed or marked absent. No waiting delay required.');
    }
  }

  /// Confirms departure from Stop N to Stop N+1
  void _handleDepartStop() {
    _stopWaitTimer?.cancel();
    setState(() {
      _isTimerActive = false;
      if (_currentStopIndex < widget.stops.length - 1) {
        _currentStopIndex++;
      }
    });

    _showToast('Departed. Advancing to Stop #${_currentStopIndex + 1}: ${widget.stops[_currentStopIndex]['name']}');
  }

  /// Driver reports road traffic or vehicle delay
  Future<void> _handleReportDelay() async {
    final TextEditingController reasonController = TextEditingController(text: _delayReason);
    int inputDelay = _delayMinutes > 0 ? _delayMinutes : 5;

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: const BeveledRectangleBorder(
          side: BorderSide(color: AppConstants.colorBlack, width: 2),
        ),
        title: const Text(
          'REPORT TRAFFIC / TRANSIT DELAY',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                labelText: 'Delay Explanation',
                hintText: 'e.g. Signal bottleneck, water logging, roadwork',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Text('Estimated Delay (mins):', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                const SizedBox(width: 8),
                DropdownButton<int>(
                  value: inputDelay,
                  items: [3, 5, 10, 15, 20, 30].map((v) => DropdownMenuItem(value: v, child: Text('+$v mins'))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => inputDelay = val);
                  },
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CANCEL')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.colorOrange,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              setState(() {
                _delayMinutes = inputDelay;
                _delayReason = reasonController.text;
              });
              Navigator.pop(ctx);
              _supabaseService.publishLiveLocation(
                busId: widget.busId,
                latitude: AppConstants.campusLatitude,
                longitude: AppConstants.campusLongitude,
                speed: _currentSpeed,
                heading: 90.0,
                journeyStatus: 'IN_TRANSIT',
                delayMinutes: _delayMinutes,
                delayReason: _delayReason,
              );
            },
            child: const Text('BROADCAST DELAY'),
          ),
        ],
      ),
    );
  }

  void _showToast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), duration: const Duration(seconds: 2)),
    );
  }

  @override
  void dispose() {
    _stopWaitTimer?.cancel();
    _locationService.stopTracking();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentStop = widget.stops[_currentStopIndex];
    final nextStop = _currentStopIndex < widget.stops.length - 1 ? widget.stops[_currentStopIndex + 1] : null;
    final bool isMoving = _currentSpeed > AppConstants.stationarySpeedKmh;

    return Scaffold(
      backgroundColor: AppConstants.colorBg,
      appBar: AppBar(
        backgroundColor: AppConstants.colorBlack,
        title: Text(
          '${widget.busNumber} • ACTIVE JOURNEY',
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.warning_amber_rounded, color: AppConstants.colorOrange),
            tooltip: 'Report Delay',
            onPressed: _handleReportDelay,
          ),
        ],
      ),
      body: Column(
        children: [
          // Delay Alert Banner if delay > 3 mins
          if (_delayMinutes > AppConstants.delayThresholdMinutes)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppConstants.colorOrange,
              child: Row(
                children: [
                  const Icon(Icons.warning, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'DELAY ALERT: +$_delayMinutes mins • $_delayReason',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),

          // Speed & Telemetry Status Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      isMoving ? '🚌' : '●',
                      style: TextStyle(
                        fontSize: isMoving ? 20 : 16,
                        color: isMoving ? null : AppConstants.colorOrange,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${_currentSpeed.toStringAsFixed(1)} KM/H',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isMoving ? '(MOVING)' : '(STOPPED)',
                      style: const TextStyle(fontSize: 10, color: Colors.black54, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  color: AppConstants.colorLime,
                  child: const Text(
                    '100m DELTA FILTER ACTIVE',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, thickness: 1.5, color: AppConstants.colorBlack),

          // Current Stop & Next Stop Indicator
          Container(
            padding: const EdgeInsets.all(16),
            color: AppConstants.colorBg,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('CURRENT STOP', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54)),
                        Text(
                          '#${currentStop['seq']} ${currentStop['name']}',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                        ),
                        Text('Scheduled: ${currentStop['time']}', style: const TextStyle(fontSize: 11, color: Colors.black54)),
                      ],
                    ),
                    if (nextStop != null)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('NEXT STOP', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54)),
                          Text(
                            '#${nextStop['seq']} ${nextStop['name']}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          Text('ETA: ${nextStop['time']}', style: const TextStyle(fontSize: 11, color: AppConstants.colorBlue)),
                        ],
                      ),
                  ],
                ),

                const SizedBox(height: 12),

                // Stop Arrival & Departure Controls
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppConstants.colorBlack,
                          side: const BorderSide(color: AppConstants.colorBlack, width: 2),
                        ),
                        onPressed: _handleArriveAtStop,
                        child: const Text('ARRIVED AT STOP', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppConstants.colorLime,
                          foregroundColor: AppConstants.colorBlack,
                          side: const BorderSide(color: AppConstants.colorBlack, width: 2),
                        ),
                        onPressed: _handleDepartStop,
                        child: const Text('DEPART STOP', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ),
                  ],
                ),

                // Mandatory 2-Minute Waiting Timer
                if (_isTimerActive)
                  Container(
                    margin: const EdgeInsets.only(top: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppConstants.colorOrange.withOpacity(0.15),
                      border: Border.all(color: AppConstants.colorOrange, width: 2),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.timer, color: AppConstants.colorOrange),
                            SizedBox(width: 8),
                            Text(
                              '2-MIN WAITING TIMER (NOT UPDATED)',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppConstants.colorBlack),
                            ),
                          ],
                        ),
                        Text(
                          '${_waitingSecondsRemaining ~/ 60}:${(_waitingSecondsRemaining % 60).toString().padLeft(2, '0')}',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppConstants.colorOrange),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          const Divider(height: 1, thickness: 1.5, color: AppConstants.colorBlack),

          // Passenger Check-In Roster for Current Stop
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'PASSENGER STATUS AT THIS STOP',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
                ),
                Text(
                  '${_currentStopPassengers.length} Total',
                  style: const TextStyle(fontSize: 11, color: Colors.black54),
                ),
              ],
            ),
          ),

          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _currentStopPassengers.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final passenger = _currentStopPassengers[index];
                final status = passenger['status'] as PassengerStatus;

                Color badgeColor;
                String statusText;
                switch (status) {
                  case PassengerStatus.coming:
                    badgeColor = Colors.green;
                    statusText = 'COMING';
                    break;
                  case PassengerStatus.absent:
                    badgeColor = Colors.red;
                    statusText = 'ABSENT';
                    break;
                  case PassengerStatus.notUpdated:
                    badgeColor = Colors.amber.shade800;
                    statusText = 'NOT UPDATED';
                    break;
                }

                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: AppConstants.colorBlack, width: 1.5),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            passenger['name'] as String,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          Text(
                            passenger['usn'] as String,
                            style: const TextStyle(fontSize: 11, color: Colors.black54, fontFamily: 'monospace'),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: badgeColor,
                          border: Border.all(color: AppConstants.colorBlack),
                        ),
                        child: Text(
                          statusText,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

