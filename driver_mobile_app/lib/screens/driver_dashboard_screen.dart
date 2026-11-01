import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../services/location_service.dart';
import 'journey_active_screen.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  final LocationService _locationService = LocationService();
  bool _isCheckingPrerequisites = false;

  // Fixed Assignment Lock per PRD
  final String driverName = 'Ramesh Kumar';
  final String driverPhone = '+91 98451 22341';
  final String busNumber = 'Bus 1';
  final String vehicleReg = 'KA-01-MJ-5421';
  final String routeName = 'Route 1: Whitefield - ITPL to Campus Express';

  final List<Map<String, dynamic>> routeStops = [
    {'seq': 1, 'name': 'ITPL Main Gate', 'time': '07:15 AM'},
    {'seq': 2, 'name': 'Hope Farm Circle', 'time': '07:22 AM'},
    {'seq': 3, 'name': 'Kundalahalli Gate', 'time': '07:30 AM'},
    {'seq': 4, 'name': 'Marathahalli Bridge', 'time': '07:40 AM'},
    {'seq': 5, 'name': 'HAL Old Airport Rd', 'time': '07:50 AM'},
    {'seq': 6, 'name': 'Domlur Flyover', 'time': '08:00 AM'},
    {'seq': 7, 'name': 'Trinity Circle', 'time': '08:10 AM'},
    {'seq': 8, 'name': 'MG Road Metro', 'time': '08:18 AM'},
    {'seq': 9, 'name': 'Richmond Circle', 'time': '08:24 AM'},
    {'seq': 10, 'name': 'College Campus Gate 1', 'time': '08:30 AM'},
  ];

  Future<void> _handleStartJourney() async {
    setState(() => _isCheckingPrerequisites = true);

    // 1. Verify GPS & Location Permissions
    final bool permissionsGranted = await _locationService.verifyLocationPrerequisites();
    setState(() => _isCheckingPrerequisites = false);

    if (!permissionsGranted) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('GPS or Background Location permission is required to broadcast telemetry.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // 2. Display Modal Confirmation Dialog
    if (!mounted) return;
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext ctx) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: const BeveledRectangleBorder(
            side: BorderSide(color: AppConstants.colorBlack, width: 2),
          ),
          title: const Text(
            'CONFIRM MORNING JOURNEY',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 16,
              color: AppConstants.colorBlack,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Starting morning transit for $busNumber ($vehicleReg).',
                style: const TextStyle(fontSize: 13, color: AppConstants.colorBlack),
              ),
              const SizedBox(height: 8),
              const Text(
                '• Continuous background GPS will activate.\n• 100-meter telemetry delta rule enforced.\n• Passenger check-in rosters will unlock.',
                style: TextStyle(fontSize: 12, color: Colors.black87),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('CANCEL', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConstants.colorLime,
                foregroundColor: AppConstants.colorBlack,
                elevation: 0,
                side: const BorderSide(color: AppConstants.colorBlack, width: 2),
              ),
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('START TRACKING', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );

    if (confirmed == true && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => JourneyActiveScreen(
            busId: 'bus-1',
            busNumber: busNumber,
            vehicleReg: vehicleReg,
            routeName: routeName,
            stops: routeStops,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.colorBg,
      appBar: AppBar(
        backgroundColor: AppConstants.colorBlack,
        elevation: 0,
        title: const Text(
          'CAMPUS RIDE — DRIVER ROSTER',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 15,
            letterSpacing: 0.5,
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppConstants.colorLime,
              border: Border.all(color: Colors.white),
            ),
            child: const Row(
              children: [
                Icon(Icons.wifi, size: 14, color: AppConstants.colorBlack),
                SizedBox(width: 4),
                Text(
                  'ONLINE',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.colorBlack,
                  ),
                ),
              ],
            ),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Driver Profile Card with Fixed Assignment Lock
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: AppConstants.colorBlack, width: 2),
                boxShadow: const [
                  BoxShadow(
                    color: AppConstants.colorBlack,
                    offset: Offset(4, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: AppConstants.colorLime,
                          border: Border.all(color: AppConstants.colorBlack, width: 2),
                        ),
                        child: const Center(
                          child: Icon(Icons.drive_eta, color: AppConstants.colorBlack, size: 28),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            driverName,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: AppConstants.colorBlack,
                            ),
                          ),
                          Text(
                            'Phone: $driverPhone',
                            style: const TextStyle(fontSize: 12, color: Colors.black54),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Divider(color: AppConstants.colorBlack, height: 24, thickness: 1.5),
                  // Vehicle Metadata & Fixed Lock Tag
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppConstants.colorBg,
                      border: Border.all(color: AppConstants.colorBlack),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '$busNumber • $vehicleReg',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              color: AppConstants.colorOrange,
                              child: const Text(
                                'ASSIGNMENT LOCKED',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          routeName,
                          style: const TextStyle(fontSize: 11, color: Colors.black87),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Start Journey Call To Action Button
            ElevatedButton(
              onPressed: _isCheckingPrerequisites ? null : _handleStartJourney,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConstants.colorLime,
                foregroundColor: AppConstants.colorBlack,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: const BeveledRectangleBorder(
                  side: BorderSide(color: AppConstants.colorBlack, width: 2),
                ),
                elevation: 4,
                shadowColor: AppConstants.colorBlack,
              ),
              child: _isCheckingPrerequisites
                  ? const CircularProgressIndicator(color: AppConstants.colorBlack)
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.play_arrow, size: 24),
                        SizedBox(width: 8),
                        Text(
                          'START MORNING JOURNEY',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ],
                    ),
            ),

            const SizedBox(height: 20),

            // Route Stops Sequence Overview (10 Stops)
            const Text(
              'ASSIGNED ROUTE STOPS (10 STOPS)',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: AppConstants.colorBlack,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),

            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: routeStops.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final stop = routeStops[index];
                final bool isCampus = index == routeStops.length - 1;
                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isCampus ? AppConstants.colorBlue.withOpacity(0.1) : Colors.white,
                    border: Border.all(color: AppConstants.colorBlack, width: 1.5),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: isCampus ? AppConstants.colorBlue : Colors.white,
                          border: Border.all(color: AppConstants.colorBlack),
                        ),
                        child: Center(
                          child: Text(
                            isCampus ? '🏛️' : '${stop['seq']}',
                            style: TextStyle(
                              fontSize: isCampus ? 12 : 11,
                              fontWeight: FontWeight.bold,
                              color: isCampus ? Colors.white : AppConstants.colorBlack,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          stop['name'] as String,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                      Text(
                        stop['time'] as String,
                        style: const TextStyle(
                          fontSize: 12,
                          fontFamily: 'monospace',
                          color: Colors.black54,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

