-- ==============================================================================
-- CAMPUS RIDE: FULL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- PostgreSQL Migration for Supabase
-- Target Version: v2.1 Final
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher', 'driver', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE checkin_status AS ENUM ('CHECKED_IN', 'NOT_CHECKED_IN', 'AUTO_CHECKED_OUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE passenger_roster_status AS ENUM ('COMING', 'ABSENT', 'NOT_UPDATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complaint_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE teacher_status AS ENUM ('ON_TIME', 'LATE', 'ABSENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE journey_status AS ENUM ('NOT_STARTED', 'IN_TRANSIT', 'ARRIVED_CAMPUS', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reassignment_status AS ENUM ('PENDING', 'REASSIGNED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CORE TABLES

-- Profiles Table (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'student',
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buses Table (7 College Buses)
CREATE TABLE IF NOT EXISTS public.buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_number INTEGER UNIQUE NOT NULL CHECK (bus_number >= 1 AND bus_number <= 7),
    registration_number TEXT UNIQUE NOT NULL,
    capacity INTEGER DEFAULT 45,
    rc_document_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes Table (7 Fixed Routes)
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_number INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color_hex TEXT DEFAULT '#3155E7',
    total_distance_km NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stops Table (10 Stops per Route)
CREATE TABLE IF NOT EXISTS public.stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL CHECK (sequence >= 1 AND sequence <= 10),
    name TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    scheduled_time TEXT NOT NULL, -- e.g. "07:30 AM"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(route_id, sequence)
);

-- Drivers Table
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
    assigned_route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
    license_number TEXT NOT NULL,
    rc_status TEXT DEFAULT 'VERIFIED',
    is_on_duty BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    usn TEXT UNIQUE NOT NULL,
    class_year TEXT NOT NULL,
    department TEXT NOT NULL,
    address TEXT NOT NULL,
    assigned_bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
    assigned_stop_id UUID REFERENCES public.stops(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    designation TEXT,
    assigned_bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
    assigned_stop_id UUID REFERENCES public.stops(id) ON DELETE SET NULL,
    current_status teacher_status DEFAULT 'ON_TIME',
    thread_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips Table (Daily Morning Journey Lifecycle)
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    journey_status journey_status DEFAULT 'NOT_STARTED',
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Passenger Check-ins Table
CREATE TABLE IF NOT EXISTS public.passenger_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
    stop_id UUID NOT NULL REFERENCES public.stops(id) ON DELETE CASCADE,
    status checkin_status DEFAULT 'NOT_CHECKED_IN',
    roster_status passenger_roster_status DEFAULT 'NOT_UPDATED',
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    is_override BOOLEAN DEFAULT FALSE,
    override_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_passenger_checkin_owner CHECK (
        (student_id IS NOT NULL AND teacher_id IS NULL) OR
        (student_id IS NULL AND teacher_id IS NOT NULL)
    )
);

-- Live Bus Locations Table (Telemetry adheres strictly to 100m Movement Rule)
CREATE TABLE IF NOT EXISTS public.live_bus_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID UNIQUE NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    speed NUMERIC(5, 2) DEFAULT 0.0,
    heading NUMERIC(5, 2) DEFAULT 0.0,
    journey_status journey_status DEFAULT 'NOT_STARTED',
    current_stop_id UUID REFERENCES public.stops(id) ON DELETE SET NULL,
    next_stop_id UUID REFERENCES public.stops(id) ON DELETE SET NULL,
    delay_minutes INTEGER DEFAULT 0,
    delay_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaints Table (Student to Admin)
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
    description TEXT NOT NULL CHECK (char_length(description) >= 10),
    status complaint_status DEFAULT 'OPEN',
    admin_comment TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_role user_role,
    target_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'emergency'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Threads Table (Private Teacher - Admin Pipeline)
CREATE TABLE IF NOT EXISTS public.chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_code TEXT UNIQUE NOT NULL, -- 'CHAT-TCH{id}-ADMIN'
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'STANDARD', -- 'STANDARD', 'EMERGENCY_ALERT', 'ADMIN_REPLY'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher Reassignments Table (Emergency work coverage)
CREATE TABLE IF NOT EXISTS public.teacher_reassignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES public.chat_threads(id) ON DELETE SET NULL,
    original_teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    substitute_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    delay_reason TEXT NOT NULL,
    status reassignment_status DEFAULT 'PENDING',
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Audit Logs Table (Strict regulatory trail for manual overrides, reassignments)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user TEXT,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE & FAST REALTIME SUBSCRIPTION
CREATE INDEX IF NOT EXISTS idx_stops_route_id ON public.stops(route_id);
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_usn ON public.students(usn);
CREATE INDEX IF NOT EXISTS idx_teachers_profile_id ON public.teachers(profile_id);
CREATE INDEX IF NOT EXISTS idx_teachers_employee_id ON public.teachers(employee_id);
CREATE INDEX IF NOT EXISTS idx_drivers_profile_id ON public.drivers(profile_id);
CREATE INDEX IF NOT EXISTS idx_live_bus_bus_id ON public.live_bus_locations(bus_id);
CREATE INDEX IF NOT EXISTS idx_passenger_checkins_trip ON public.passenger_checkins(trip_id);
CREATE INDEX IF NOT EXISTS idx_passenger_checkins_student ON public.passenger_checkins(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_student ON public.complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON public.chat_messages(thread_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passenger_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_reassignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security function: Check user role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: Authenticated users can view their own profile; Admin can view all
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.get_auth_role() = 'admin');

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Buses, Routes, Stops: Readable by all authenticated users; Writable by Admin only
CREATE POLICY "Public read buses" ON public.buses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read routes" ON public.routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read stops" ON public.stops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write buses" ON public.buses FOR ALL TO authenticated USING (public.get_auth_role() = 'admin');
CREATE POLICY "Admin write routes" ON public.routes FOR ALL TO authenticated USING (public.get_auth_role() = 'admin');
CREATE POLICY "Admin write stops" ON public.stops FOR ALL TO authenticated USING (public.get_auth_role() = 'admin');

-- Students: Student can read own data; Admin and assigned Driver can read; Admin can update
CREATE POLICY "Student read own record" ON public.students
    FOR SELECT TO authenticated
    USING (
        profile_id = auth.uid() OR
        public.get_auth_role() = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.drivers d 
            WHERE d.profile_id = auth.uid() AND d.assigned_bus_id = students.assigned_bus_id
        )
    );

-- Teachers: Teacher can read own record; Admin can view all; Admin can update
CREATE POLICY "Teacher read own record" ON public.teachers
    FOR SELECT TO authenticated
    USING (
        profile_id = auth.uid() OR
        public.get_auth_role() = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.drivers d 
            WHERE d.profile_id = auth.uid() AND d.assigned_bus_id = teachers.assigned_bus_id
        )
    );

CREATE POLICY "Teacher update status" ON public.teachers
    FOR UPDATE TO authenticated
    USING (profile_id = auth.uid() OR public.get_auth_role() = 'admin');

-- Live Bus Locations:
-- Drivers can update their assigned bus location
-- Students/Teachers can only view their assigned bus location
-- Admin can view and manage all bus locations
CREATE POLICY "View live bus locations" ON public.live_bus_locations
    FOR SELECT TO authenticated
    USING (
        public.get_auth_role() = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.profile_id = auth.uid() AND s.assigned_bus_id = live_bus_locations.bus_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.profile_id = auth.uid() AND t.assigned_bus_id = live_bus_locations.bus_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.profile_id = auth.uid() AND d.assigned_bus_id = live_bus_locations.bus_id
        )
    );

CREATE POLICY "Driver update live location" ON public.live_bus_locations
    FOR UPDATE TO authenticated
    USING (
        public.get_auth_role() = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.profile_id = auth.uid() AND d.assigned_bus_id = live_bus_locations.bus_id
        )
    );

-- Passenger Check-ins:
-- Students can insert/update their own check-in (before cutoff)
-- Drivers can read passengers for their bus
-- Admins have full access and override
CREATE POLICY "Read passenger checkins" ON public.passenger_checkins
    FOR SELECT TO authenticated
    USING (
        public.get_auth_role() = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.profile_id = auth.uid() AND s.id = passenger_checkins.student_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.profile_id = auth.uid() AND t.id = passenger_checkins.teacher_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.profile_id = auth.uid() AND d.assigned_bus_id = passenger_checkins.bus_id
        )
    );

CREATE POLICY "Student insert own checkin" ON public.passenger_checkins
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.profile_id = auth.uid() AND s.id = student_id
        ) OR
        public.get_auth_role() = 'admin'
    );

CREATE POLICY "Teacher insert own checkin" ON public.passenger_checkins
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.profile_id = auth.uid() AND t.id = teacher_id
        ) OR
        public.get_auth_role() = 'admin'
    );

-- Complaints:
-- Students can read & insert their own complaints
-- Admins can read & update (resolve) complaints
CREATE POLICY "Student manage own complaints" ON public.complaints
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.profile_id = auth.uid() AND s.id = complaints.student_id
        ) OR
        public.get_auth_role() = 'admin'
    );

-- Chat Messages (Teacher & Admin Private Channel)
CREATE POLICY "Chat message access" ON public.chat_messages
    FOR ALL TO authenticated
    USING (
        sender_id = auth.uid() OR
        public.get_auth_role() = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.chat_threads ct
            JOIN public.teachers t ON ct.teacher_id = t.id
            WHERE ct.id = chat_messages.thread_id AND t.profile_id = auth.uid()
        )
    );

-- Audit Logs: Admin only
CREATE POLICY "Admin audit log access" ON public.audit_logs
    FOR ALL TO authenticated
    USING (public.get_auth_role() = 'admin');

-- 5. ENABLE REALTIME ON CRITICAL TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_bus_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.passenger_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;

