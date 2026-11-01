# Campus Ride Driver Mobile Application (Flutter)

In-bus mobile application for college drivers running native background GPS tracking, strictly adhering to the 100-meter movement delta rule, 2-minute stop waiting countdown timer, and shared Supabase database.

---

## Technical Specifications
- **Framework:** Flutter (Dart `>=3.3.0`)
- **Backend:** Shared Supabase project (`fdykbhkghdppeiwizinc.supabase.co`)
- **Native Background Telemetry:** Geolocator with background execution permissions on Android & iOS
- **Movement Rule:** Haversine great-circle calculation (`>= 100 meters` publication threshold)
- **Passenger Roster Statuses:**
  - `COMING` (Green) — Passenger confirmed boarding.
  - `ABSENT` (Red) — Explicitly marked absent; driver skips waiting logic.
  - `NOT UPDATED` (Amber) — Executes mandatory 2-minute countdown timer upon stop arrival.

---

## Mobile Execution Quickstart

```bash
cd driver_mobile_app

# 1. Fetch dependencies
flutter pub get

# 2. Run on connected Android / iOS device or simulator
flutter run
```

