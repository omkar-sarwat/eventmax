#!/bin/bash
set -e

echo "🚀 Initializing EventMax Database..."

# Create extensions
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable necessary extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    
    -- Create custom types
    CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'user');
    CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'postponed', 'completed');
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded');
    CREATE TYPE seat_status AS ENUM ('available', 'reserved', 'booked', 'blocked');
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        date_of_birth DATE,
        role user_role DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        is_email_verified BOOLEAN DEFAULT false,
        email_verification_token VARCHAR(255),
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP WITH TIME ZONE,
        last_login TIMESTAMP WITH TIME ZONE,
        profile_image_url TEXT,
        bio TEXT,
        website_url TEXT,
        social_links JSONB DEFAULT '{}',
        preferences JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create venues table
    CREATE TABLE IF NOT EXISTS venues (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        country VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        capacity INTEGER NOT NULL DEFAULT 0,
        amenities JSONB DEFAULT '[]',
        images JSONB DEFAULT '[]',
        contact_info JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create events table
    CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        short_description TEXT,
        organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100),
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        timezone VARCHAR(50) DEFAULT 'UTC',
        status event_status DEFAULT 'draft',
        is_featured BOOLEAN DEFAULT false,
        is_public BOOLEAN DEFAULT true,
        max_attendees INTEGER,
        current_attendees INTEGER DEFAULT 0,
        min_price DECIMAL(10, 2),
        max_price DECIMAL(10, 2),
        currency VARCHAR(3) DEFAULT 'USD',
        images JSONB DEFAULT '[]',
        tags JSONB DEFAULT '[]',
        seat_map JSONB DEFAULT '{}',
        ticket_types JSONB DEFAULT '[]',
        policies JSONB DEFAULT '{}',
        organizer_notes TEXT,
        cancellation_policy TEXT,
        refund_policy TEXT,
        age_restriction INTEGER,
        dress_code VARCHAR(100),
        languages JSONB DEFAULT '["en"]',
        accessibility JSONB DEFAULT '{}',
        social_links JSONB DEFAULT '{}',
        external_links JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        view_count INTEGER DEFAULT 0,
        share_count INTEGER DEFAULT 0,
        favorite_count INTEGER DEFAULT 0,
        search_vector tsvector,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create seats table
    CREATE TABLE IF NOT EXISTS seats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        section VARCHAR(50),
        row_name VARCHAR(10) NOT NULL,
        seat_number INTEGER NOT NULL,
        seat_type VARCHAR(50) DEFAULT 'standard',
        price DECIMAL(10, 2) NOT NULL,
        status seat_status DEFAULT 'available',
        is_accessible BOOLEAN DEFAULT false,
        metadata JSONB DEFAULT '{}',
        reserved_at TIMESTAMP WITH TIME ZONE,
        reserved_until TIMESTAMP WITH TIME ZONE,
        reserved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(event_id, section, row_name, seat_number)
    );

    -- Create bookings table
    CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        booking_reference VARCHAR(20) UNIQUE NOT NULL,
        status booking_status DEFAULT 'pending',
        total_seats INTEGER NOT NULL DEFAULT 0,
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
        fees DECIMAL(10, 2) NOT NULL DEFAULT 0,
        taxes DECIMAL(10, 2) NOT NULL DEFAULT 0,
        discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'USD',
        payment_method VARCHAR(50),
        payment_status payment_status DEFAULT 'pending',
        payment_id VARCHAR(255),
        promo_code VARCHAR(50),
        billing_address JSONB DEFAULT '{}',
        special_requests TEXT,
        notes TEXT,
        cancelled_at TIMESTAMP WITH TIME ZONE,
        cancellation_reason TEXT,
        refund_amount DECIMAL(10, 2),
        refund_processed_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create booking_seats table (many-to-many relationship)
    CREATE TABLE IF NOT EXISTS booking_seats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
        price_paid DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(booking_id, seat_id)
    );

    -- Create event_favorites table
    CREATE TABLE IF NOT EXISTS event_favorites (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, event_id)
    );

    -- Create event_views table (for analytics)
    CREATE TABLE IF NOT EXISTS event_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ip_address INET,
        user_agent TEXT,
        referrer TEXT,
        session_id VARCHAR(255),
        view_duration INTEGER, -- in seconds
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create event_shares table (for analytics)
    CREATE TABLE IF NOT EXISTS event_shares (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        platform VARCHAR(50) NOT NULL,
        ip_address INET,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create notifications table
    CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create user_sessions table
    CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        refresh_token_hash VARCHAR(255),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true,
        last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for performance
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_organizer ON events(organizer_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_venue ON events(venue_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_category ON events(category);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_status ON events(status);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_featured ON events(is_featured) WHERE is_featured = true;
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_search ON events USING gin(search_vector);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_location ON venues USING gin((city, country));
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seats_event ON seats(event_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seats_status ON seats(status);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seats_reserved ON seats(reserved_until) WHERE status = 'reserved';
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_user ON bookings(user_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_event ON bookings(event_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_seats_booking ON booking_seats(booking_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_seats_seat ON booking_seats(seat_id);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user ON event_favorites(user_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_event ON event_favorites(event_id);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_event ON event_views(event_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_user ON event_views(user_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_created ON event_views(created_at);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shares_event ON event_shares(event_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shares_platform ON event_shares(platform);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_active ON user_sessions(is_active) WHERE is_active = true;

    -- Create triggers for updated_at timestamps
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS \$\$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    \$\$ language 'plpgsql';

    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON seats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Create function to update search vector
    CREATE OR REPLACE FUNCTION update_event_search_vector()
    RETURNS TRIGGER AS \$\$
    BEGIN
        NEW.search_vector = to_tsvector('english', 
            COALESCE(NEW.title, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.category, '') || ' ' ||
            COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(NEW.tags)), ' '), '')
        );
        RETURN NEW;
    END;
    \$\$ language 'plpgsql';

    CREATE TRIGGER update_event_search_vector_trigger 
    BEFORE INSERT OR UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_event_search_vector();

    -- Create function to automatically expire seat reservations
    CREATE OR REPLACE FUNCTION expire_seat_reservations()
    RETURNS TRIGGER AS \$\$
    BEGIN
        UPDATE seats 
        SET status = 'available', 
            reserved_at = NULL, 
            reserved_until = NULL, 
            reserved_by = NULL
        WHERE status = 'reserved' 
        AND reserved_until < NOW();
        
        RETURN NULL;
    END;
    \$\$ language 'plpgsql';

    -- Create function to generate booking reference
    CREATE OR REPLACE FUNCTION generate_booking_reference()
    RETURNS TRIGGER AS \$\$
    BEGIN
        NEW.booking_reference = 'EMX' || UPPER(SUBSTRING(CAST(NEW.id AS TEXT) FROM 1 FOR 8)) || TO_CHAR(NOW(), 'YYYYMMDD');
        RETURN NEW;
    END;
    \$\$ language 'plpgsql';

    CREATE TRIGGER generate_booking_reference_trigger 
    BEFORE INSERT ON bookings 
    FOR EACH ROW EXECUTE FUNCTION generate_booking_reference();

EOSQL

echo "✅ EventMax Database initialization complete!"
