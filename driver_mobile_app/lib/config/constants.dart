import 'package:flutter/material.dart';

class AppConstants {
  // Supabase Configuration
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://fdykbhkghdppeiwizinc.supabase.co',
  );
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkeWtiaGtnaGRwcGVpd2l6aW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MzAyODcsImV4cCI6MjEwOTEwNjI4N30.zvAEX6jqlAmRXQrgTV8rcC2E_MIR9WA4Ns_Qq8wWI94',
  );

  // Campus Geofence Coordinates (Bangalore Campus Center)
  static const double campusLatitude = 12.9716;
  static const double campusLongitude = 77.5946;
  static const double campusGeofenceRadiusMeters = 200.0;

  // Strict Telemetry Rules
  static const double movementThresholdMeters = 100.0; // 100m Haversine delta rule
  static const double stationarySpeedKmh = 3.0; // <= 3 km/h = stationary node, > 3 km/h = bus emoji
  static const int stopWaitingTimerSeconds = 120; // 2-minute countdown for NOT_UPDATED
  static const int delayThresholdMinutes = 3; // > 3 mins delay triggers alert & banner

  // Swiss International / Neo-Brutalist Color Palette
  static const Color colorBg = Color(0xFFF4F1E8);
  static const Color colorBlack = Color(0xFF171717);
  static const Color colorBlue = Color(0xFF3155E7);
  static const Color colorOrange = Color(0xFFFF7043);
  static const Color colorLime = Color(0xFFD7F36B);
  static const Color colorMuted = Color(0xFFA6A49C);
  static const Color colorCard = Colors.white;
}

enum PassengerStatus {
  coming,    // Green
  absent,    // Red
  notUpdated // Amber (Triggers 2-minute timer upon stop arrival)
}

