-- EventMax Database Schema
-- Clean, production-ready schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================
-- ENUMS
-- ======================
CREATE TYPE user_role AS ENUM ('customer', 'organizer', 'admin');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE seat_status AS ENUM ('available', 'reserved', 'booked', 'blocked');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- ======================
-- USERS TABLE
-- ======================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'customer',
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ======================
-- EVENT CATEGORIES TABLE
-- ======================
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================
-- EVENTS TABLE
-- ======================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT,
    venue_city VARCHAR(100),
    venue_state VARCHAR(100),
    venue_country VARCHAR(100) DEFAULT 'USA',
    venue_capacity INTEGER DEFAULT 100,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    doors_open TIMESTAMP WITH TIME ZONE,
    base_price DECIMAL(10,2) DEFAULT 0,
    max_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    image_url TEXT,
    thumbnail_url TEXT,
    category_id UUID REFERENCES event_categories(id),
    organizer_id UUID REFERENCES users(id),
    status event_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    is_sold_out BOOLEAN DEFAULT FALSE,
    total_seats INTEGER DEFAULT 0,
    available_seats INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_featured ON events(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_organizer ON events(organizer_id);

-- ======================
-- SEATS TABLE
-- ======================
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    section VARCHAR(50),
    row_label VARCHAR(10),
    seat_number VARCHAR(10) NOT NULL,
    seat_label VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    status seat_status DEFAULT 'available',
    reserved_by UUID REFERENCES users(id),
    reserved_until TIMESTAMP WITH TIME ZONE,
    reservation_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_seats_event ON seats(event_id);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seats_reservation ON seats(reservation_token) WHERE reservation_token IS NOT NULL;
CREATE UNIQUE INDEX idx_seats_unique ON seats(event_id, section, row_label, seat_number);

-- ======================
-- BOOKINGS TABLE
-- ======================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    customer_email VARCHAR(255) NOT NULL,
    customer_first_name VARCHAR(100) NOT NULL,
    customer_last_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    total_seats INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_id VARCHAR(255),
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_event ON bookings(event_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ======================
-- BOOKING SEATS (junction table)
-- ======================
CREATE TABLE booking_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id),
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_booking_seats_booking ON booking_seats(booking_id);
CREATE INDEX idx_booking_seats_seat ON booking_seats(seat_id);

-- ======================
-- INVOICES TABLE
-- ======================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'issued',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ======================
-- HELPER FUNCTIONS
-- ======================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'EVT' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
END;
$$ LANGUAGE plpgsql;

-- ======================
-- TRIGGERS
-- ======================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON seats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
