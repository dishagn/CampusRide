/**
 * System-wide constants for Campus Ride
 */

// Configured Campus Coordinates (Bangalore Institute Campus Center)
export const CAMPUS_CONFIG = {
  NAME: 'City Engineering & Technology Campus',
  LATITUDE: parseFloat(import.meta.env.VITE_CAMPUS_LATITUDE) || 12.9716,
  LONGITUDE: parseFloat(import.meta.env.VITE_CAMPUS_LONGITUDE) || 77.5946,
  GEOFENCE_RADIUS_METERS: parseInt(import.meta.env.VITE_CAMPUS_GEOFENCE_RADIUS_METERS, 10) || 200,
  CHECKIN_CUTOFF_MINUTES: 10, // Must check in at least 10 minutes before scheduled arrival
  STALE_LOCATION_THRESHOLD_SECONDS: 120, // 2 minutes with no GPS updates triggers STALE alert
  MOVEMENT_THRESHOLD_METERS: 100, // 100-meter minimum telemetry publication rule
  STATIONARY_SPEED_KMH: 3.0, // Speed threshold: >3 km/h = moving (Bus emoji), <=3 km/h = stationary node
  DELAY_ALERT_THRESHOLD_MINUTES: 3, // Delay > 3 mins triggers delay icon & banner
  STOP_WAITING_TIMER_SECONDS: 120, // 2-minute mandatory waiting countdown for "Not Updated" passengers
};

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  DRIVER: 'driver',
  ADMIN: 'admin',
};

export const CHECKIN_STATUS = {
  CHECKED_IN: 'CHECKED_IN',
  NOT_CHECKED_IN: 'NOT_CHECKED_IN',
  AUTO_CHECKED_OUT: 'AUTO_CHECKED_OUT',
};

export const PASSENGER_ROSTER_STATUS = {
  COMING: 'COMING', // Green
  ABSENT: 'ABSENT', // Red
  NOT_UPDATED: 'NOT_UPDATED', // Amber
};

export const TEACHER_STATUS = {
  ON_TIME: 'ON_TIME',
  LATE: 'LATE',
  ABSENT: 'ABSENT',
};

export const COMPLAINT_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
};

export const REASSIGNMENT_STATUS = {
  PENDING: 'PENDING',
  REASSIGNED: 'REASSIGNED',
};

export const JOURNEY_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED_CAMPUS: 'ARRIVED_CAMPUS',
  COMPLETED: 'COMPLETED',
};

export const DELAY_REASONS = [
  'Traffic congestion',
  'Road closure',
  'Mechanical issue',
  'Passenger pickup',
  'Severe weather / waterlogging',
  'Other',
];

export const TILE_SERVER_CONFIG = {
  URL: import.meta.env.VITE_TILE_SERVER_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

export const OSRM_API_BASE = import.meta.env.VITE_OSRM_ROUTING_URL || 'https://router.project-osrm.org';

