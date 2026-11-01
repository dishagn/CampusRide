-- ==============================================================================
-- CAMPUS RIDE: SEED DATA MIGRATION (7 Buses, 7 Routes, 70 Stops, Initial Telemetry)
-- Run this in Supabase SQL Editor after running 20261101_init_campus_ride.sql
-- ==============================================================================

-- 1. Insert 7 Buses
INSERT INTO public.buses (bus_number, registration_number, capacity) VALUES
(1, 'KA-01-MJ-5421', 45),
(2, 'KA-03-TR-8812', 45),
(3, 'KA-04-NB-3304', 45),
(4, 'KA-05-MK-9921', 45),
(5, 'KA-02-AB-1234', 45),
(6, 'KA-51-EF-4411', 45),
(7, 'KA-01-XY-7765', 45)
ON CONFLICT (bus_number) DO NOTHING;

-- 2. Insert 7 Routes
INSERT INTO public.routes (route_number, name, description, color_hex, total_distance_km) VALUES
(1, 'Whitefield - ITPL to Campus Express', 'Eastern IT corridor via Marathahalli & HAL', '#3155E7', 21.40),
(2, 'Indiranagar - Koramangala Central Loop', 'Central loop via Sony World & Dairy Circle', '#FF7043', 16.80),
(3, 'Jayanagar - BTM - Bannerghatta Line', 'South residential corridor via Lalbagh', '#D7F36B', 18.20),
(4, 'Hebbal - Yelahanka Northern Flyer', 'North Bellary Road arterial corridor', '#0EA5E9', 22.00),
(5, 'Malleshwaram - Rajajinagar Arterial', 'Western residential and transport hub', '#8B5CF6', 14.50),
(6, 'Electronic City - HSR Layout Hub', 'Hosur Road tech artery to Silk Board', '#10B981', 23.50),
(7, 'Banashankari - JP Nagar - Basavanagudi Line', 'South-West heritage and metro connection line', '#EC4899', 15.10)
ON CONFLICT (route_number) DO NOTHING;

-- 3. Insert Stops for all 7 Routes (10 Stops each = 70 Total Stops)
DO $$
DECLARE
    r1 UUID; r2 UUID; r3 UUID; r4 UUID; r5 UUID; r6 UUID; r7 UUID;
BEGIN
    SELECT id INTO r1 FROM public.routes WHERE route_number = 1;
    SELECT id INTO r2 FROM public.routes WHERE route_number = 2;
    SELECT id INTO r3 FROM public.routes WHERE route_number = 3;
    SELECT id INTO r4 FROM public.routes WHERE route_number = 4;
    SELECT id INTO r5 FROM public.routes WHERE route_number = 5;
    SELECT id INTO r6 FROM public.routes WHERE route_number = 6;
    SELECT id INTO r7 FROM public.routes WHERE route_number = 7;

    -- Route 1 (Whitefield)
    IF r1 IS NOT NULL THEN
        INSERT INTO public.stops (route_id, sequence, name, latitude, longitude, scheduled_time) VALUES
        (r1, 1, 'ITPL Main Gate', 12.9866, 77.7289, '07:15 AM'),
        (r1, 2, 'Hope Farm Circle', 12.9841, 77.7441, '07:22 AM'),
        (r1, 3, 'Kundalahalli Gate', 12.9667, 77.7136, '07:30 AM'),
        (r1, 4, 'Marathahalli Bridge', 12.9562, 77.7011, '07:40 AM'),
        (r1, 5, 'HAL Old Airport Rd', 12.9592, 77.6653, '07:50 AM'),
        (r1, 6, 'Domlur Flyover', 12.9609, 77.6387, '08:00 AM'),
        (r1, 7, 'Trinity Circle', 12.9724, 77.6200, '08:10 AM'),
        (r1, 8, 'MG Road Metro', 12.9756, 77.6066, '08:18 AM'),
        (r1, 9, 'Richmond Circle', 12.9678, 77.5992, '08:24 AM'),
        (r1, 10, 'College Campus Gate 1', 12.9716, 77.5946, '08:30 AM')
        ON CONFLICT (route_id, sequence) DO NOTHING;
    END IF;

    -- Route 2 (Indiranagar / Koramangala)
    IF r2 IS NOT NULL THEN
        INSERT INTO public.stops (route_id, sequence, name, latitude, longitude, scheduled_time) VALUES
        (r2, 1, 'Indiranagar Depot', 12.9784, 77.6408, '07:20 AM'),
        (r2, 2, 'CMH Road Metro', 12.9781, 77.6445, '07:28 AM'),
        (r2, 3, '100ft Road BDA', 12.9664, 77.6421, '07:35 AM'),
        (r2, 4, 'Sony World Junction', 12.9360, 77.6271, '07:45 AM'),
        (r2, 5, 'Koramangala Water Tank', 12.9312, 77.6180, '07:52 AM'),
        (r2, 6, 'Dairy Circle Flyover', 12.9365, 77.6001, '08:02 AM'),
        (r2, 7, 'Adugodi Signal', 12.9431, 77.6065, '08:10 AM'),
        (r2, 8, 'Langford Road', 12.9555, 77.5985, '08:18 AM'),
        (r2, 9, 'Mayo Hall Corner', 12.9740, 77.6080, '08:24 AM'),
        (r2, 10, 'College Campus Gate 2', 12.9716, 77.5946, '08:30 AM')
        ON CONFLICT (route_id, sequence) DO NOTHING;
    END IF;

    -- Route 3 (Jayanagar / BTM)
    IF r3 IS NOT NULL THEN
        INSERT INTO public.stops (route_id, sequence, name, latitude, longitude, scheduled_time) VALUES
        (r3, 1, 'Arekere Gate', 12.8892, 77.5975, '07:15 AM'),
        (r3, 2, 'IIM Bangalore Gate', 12.8988, 77.6015, '07:22 AM'),
        (r3, 3, 'BTM Ring Road Water Tank', 12.9150, 77.6101, '07:32 AM'),
        (r3, 4, 'Jayanagar 4th Block Complex', 12.9298, 77.5833, '07:44 AM'),
        (r3, 5, 'South End Circle', 12.9366, 77.5788, '07:54 AM'),
        (r3, 6, 'Lalbagh West Gate', 12.9482, 77.5794, '08:04 AM'),
        (r3, 7, 'Minerva Circle', 12.9560, 77.5815, '08:12 AM'),
        (r3, 8, 'Town Hall Circle', 12.9642, 77.5855, '08:18 AM'),
        (r3, 9, 'Corporation Signal', 12.9680, 77.5898, '08:24 AM'),
        (r3, 10, 'College Campus Gate 1', 12.9716, 77.5946, '08:30 AM')
        ON CONFLICT (route_id, sequence) DO NOTHING;
    END IF;

    -- Route 4 (Hebbal / Yelahanka)
    IF r4 IS NOT NULL THEN
        INSERT INTO public.stops (route_id, sequence, name, latitude, longitude, scheduled_time) VALUES
        (r4, 1, 'Yelahanka Police Station', 13.1007, 77.5963, '07:15 AM'),
        (r4, 2, 'Allalasandra Flyover', 13.0855, 77.5925, '07:22 AM'),
        (r4, 3, 'Jakkur Aerodrome Gate', 13.0762, 77.6045, '07:30 AM'),
        (r4, 4, 'Hebbal Flyover Junction', 13.0358, 77.5970, '07:42 AM'),
        (r4, 5, 'Ganganagar Post Office', 13.0182, 77.5901, '07:52 AM'),
        (r4, 6, 'Mekhri Circle Underpass', 13.0084, 77.5835, '08:02 AM'),
        (r4, 7, 'Palace Grounds Entrance', 12.9972, 77.5862, '08:10 AM'),
        (r4, 8, 'Vasanth Nagar Canara Bank', 12.9880, 77.5899, '08:18 AM'),
        (r4, 9, 'Vidhana Soudha Gate', 12.9796, 77.5908, '08:24 AM'),
        (r4, 10, 'College Campus Gate 3', 12.9716, 77.5946, '08:30 AM')
        ON CONFLICT (route_id, sequence) DO NOTHING;
    END IF;

    -- Route 5 (Malleshwaram)
    IF r5 IS NOT NULL THEN
        INSERT INTO public.stops (route_id, sequence, name, latitude, longitude, scheduled_time) VALUES
        (r5, 1, 'Yeshwanthpur TTMC', 13.0238, 77.5499, '07:25 AM'),
        (r5, 2, 'Malleshwaram 18th Cross', 13.0125, 77.5670, '07:33 AM'),
        (r5, 3, 'Malleshwaram 8th Cross', 13.0031, 77.5701, '07:40 AM'),
        (r5, 4, 'Navrang Theatre Circle', 12.9930, 77.5540, '07:48 AM'),
        (r5, 5, 'Rajajinagar 1st Block', 12.9860, 77.5585, '07:56 AM'),
        (r5, 6, 'Okalipuram Signal', 12.9820, 77.5680, '08:05 AM'),
        (r5, 7, 'Majestic Sangam Theatre', 12.9768, 77.5723, '08:14 AM'),
        (r5, 8, 'K R Market Metro', 12.9635, 77.5760, '08:20 AM'),
        (r5, 9, 'Hudson Circle', 12.9698, 77.5872, '08:25 AM'),
        (r5, 10, 'College Campus Gate 1', 12.9716, 77.5946, '08:30 AM')
        ON CONFLICT (route_id, sequence) DO NOTHING;
    END IF;

    -- Route 6 (Electronic City / HSR)
    IF r6 IS NOT NULL THEN
        INSERT INTO public.stops (route_id, sequence, name, latitude, longitude, scheduled_time) VALUES
        (r6, 1, 'Infosys Main Gate (E-City Phase 1)', 12.8488, 77.6601, '07:10 AM'),
        (r6, 2, 'Electronic City Toll Plaza', 12.8590, 77.6580, '07:18 AM'),
        (r6, 3, 'Bommanahalli Junction', 12.9030, 77.6250, '07:35 AM'),
        (r6, 4, 'Central Silk Board Flyover', 12.9177, 77.6238, '07:45 AM'),
        (r6, 5, 'HSR Layout 14th Main', 12.9120, 77.6385, '07:54 AM'),
        (r6, 6, 'Madiwala Market', 12.9220, 77.6180, '08:05 AM'),
        (r6, 7, 'St. John''s Hospital Signal', 12.9315, 77.6190, '08:12 AM'),
        (r6, 8, 'Wilson Garden 10th Cross', 12.9440, 77.5980, '08:19 AM'),
        (r6, 9, 'Shanthinagar Bus Station', 12.9567, 77.5950, '08:24 AM'),
        (r6, 10, 'College Campus Gate 2', 12.9716, 77.5946, '08:30 AM')
        ON CONFLICT (route_id, sequence) DO NOTHING;
    END IF;

    -- Route 7 (Banashankari / JP Nagar)
    IF r7 IS NOT NULL THEN
        INSERT INTO public.stops (route_id, sequence, name, latitude, longitude, scheduled_time) VALUES
        (r7, 1, 'Banashankari Temple TTMC', 12.9155, 77.5736, '07:20 AM'),
        (r7, 2, 'JP Nagar 6th Phase', 12.9070, 77.5790, '07:28 AM'),
        (r7, 3, 'Sarakki Signal', 12.9100, 77.5850, '07:36 AM'),
        (r7, 4, 'Yediyur Lake Ring Road', 12.9280, 77.5740, '07:46 AM'),
        (r7, 5, 'Gandhi Bazaar Circle', 12.9438, 77.5694, '07:56 AM'),
        (r7, 6, 'National College Basavanagudi', 12.9505, 77.5730, '08:06 AM'),
        (r7, 7, 'Chamrajpet 5th Main', 12.9580, 77.5680, '08:14 AM'),
        (r7, 8, 'Kalasipalya Bus Terminal', 12.9610, 77.5790, '08:20 AM'),
        (r7, 9, 'Kanteerava Stadium Gate', 12.9690, 77.5910, '08:25 AM'),
        (r7, 10, 'College Campus Gate 1', 12.9716, 77.5946, '08:30 AM')
        ON CONFLICT (route_id, sequence) DO NOTHING;
    END IF;
END $$;

-- 4. Initial Live Bus Locations (Buses 1 to 7)
DO $$
DECLARE
    b_rec RECORD;
BEGIN
    FOR b_rec IN SELECT id, bus_number FROM public.buses LOOP
        INSERT INTO public.live_bus_locations (bus_id, latitude, longitude, speed, heading, journey_status, delay_minutes)
        VALUES (
            b_rec.id,
            12.9716 + (b_rec.bus_number * 0.005),
            77.5946 + (b_rec.bus_number * 0.005),
            32.0,
            90.0,
            'IN_TRANSIT',
            CASE WHEN b_rec.bus_number IN (2, 6) THEN 5 ELSE 0 END
        )
        ON CONFLICT (bus_id) DO NOTHING;
    END LOOP;
END $$;
