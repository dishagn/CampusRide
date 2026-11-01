import 'package:flutter/material.dart';
import 'config/constants.dart';
import 'services/supabase_service.dart';
import 'screens/driver_dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase client
  final supabaseService = SupabaseService();
  await supabaseService.initialize();

  runApp(const CampusRideDriverApp());
}

class CampusRideDriverApp extends StatelessWidget {
  const CampusRideDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Campus Ride Driver',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Inter',
        scaffoldBackgroundColor: AppConstants.colorBg,
        primaryColor: AppConstants.colorBlue,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppConstants.colorBlue,
          surface: AppConstants.colorBg,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppConstants.colorBlack,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const DriverDashboardScreen(),
    );
  }
}

