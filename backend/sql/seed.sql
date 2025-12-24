-- EventMax Seed Data
-- Matches actual database schema with proper constraints

-- Disable triggers temporarily for bulk insert
ALTER TABLE users DISABLE TRIGGER audit_users_trigger;
ALTER TABLE events DISABLE TRIGGER audit_events_trigger;

-- Clear existing data
TRUNCATE TABLE bookings, seats, events, users, event_categories RESTART IDENTITY CASCADE;

-- Insert event categories
INSERT INTO event_categories (id, name, slug, description, color_hex, display_order, is_active) VALUES
('a1111111-1111-1111-1111-111111111111', 'Concerts', 'concerts', 'Live music performances', '#E91E63', 1, true),
('a2222222-2222-2222-2222-222222222222', 'Theater', 'theater', 'Theatrical performances and plays', '#9C27B0', 2, true),
('a3333333-3333-3333-3333-333333333333', 'Sports', 'sports', 'Sporting events', '#2196F3', 3, true),
('a4444444-4444-4444-4444-444444444444', 'Conferences', 'conferences', 'Professional conferences', '#4CAF50', 4, true),
('a5555555-5555-5555-5555-555555555555', 'Comedy', 'comedy', 'Stand-up comedy shows', '#FF9800', 5, true),
('a6666666-6666-6666-6666-666666666666', 'Festivals', 'festivals', 'Music and cultural festivals', '#795548', 6, true);

-- Insert test users (password is 'password123' hashed with bcrypt)
-- Phone format must match: ^\+?[1-9]\d{1,14}$
INSERT INTO users (id, email, password_hash, first_name, last_name, role, email_verified, is_active, phone) VALUES
('b1111111-1111-1111-1111-111111111111', 'admin@eventmax.com', '$2b$12$LQv3c1yqBwEHxE.9IfzYKef8r/PmWJV7MwFwLaAOW1a3XDDY6OVz2', 'Admin', 'User', 'admin', true, true, '+15550001000'),
('b2222222-2222-2222-2222-222222222222', 'organizer@example.com', '$2b$12$LQv3c1yqBwEHxE.9IfzYKef8r/PmWJV7MwFwLaAOW1a3XDDY6OVz2', 'Sarah', 'Johnson', 'organizer', true, true, '+15550002000'),
('b3333333-3333-3333-3333-333333333333', 'user@example.com', '$2b$12$LQv3c1yqBwEHxE.9IfzYKef8r/PmWJV7MwFwLaAOW1a3XDDY6OVz2', 'John', 'Doe', 'customer', true, true, '+15550003000'),
('b4444444-4444-4444-4444-444444444444', 'test@example.com', '$2b$12$LQv3c1yqBwEHxE.9IfzYKef8r/PmWJV7MwFwLaAOW1a3XDDY6OVz2', 'Test', 'User', 'customer', true, true, '+15550004000');

-- Insert sample events
-- NOTE: event_date must be > NOW(), doors_open_time <= event_date, event_end_time >= event_date
INSERT INTO events (
    id, title, slug, description, short_description,
    venue_name, venue_address, venue_city, venue_state, venue_country,
    event_date, doors_open_time, event_end_time,
    base_price, currency, total_seats, max_seats_per_booking,
    status, is_featured, is_public,
    organizer_id, category_id,
    poster_image_url
) VALUES
-- Concert 1
(
    'c1111111-1111-1111-1111-111111111111',
    'Rock Legends Live',
    'rock-legends-live-2026',
    'Experience an unforgettable night with legendary rock performers. This concert features award-winning artists in an intimate venue with state-of-the-art sound.',
    'Rock legends perform their greatest hits live!',
    'Madison Square Garden',
    '4 Pennsylvania Plaza',
    'New York',
    'NY',
    'USA',
    NOW() + INTERVAL '90 days',
    NOW() + INTERVAL '90 days' - INTERVAL '1 hour',
    NOW() + INTERVAL '90 days' + INTERVAL '4 hours',
    89.99,
    'USD',
    500,
    8,
    'published',
    true,
    true,
    'b2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'
),
-- Concert 2
(
    'c2222222-2222-2222-2222-222222222222',
    'Jazz Night Under the Stars',
    'jazz-night-stars-2026',
    'A magical evening of jazz under the open sky. World-class musicians perform classic jazz standards and contemporary pieces.',
    'Enchanting jazz performance under the stars.',
    'Hollywood Bowl',
    '2301 N Highland Ave',
    'Los Angeles',
    'CA',
    'USA',
    NOW() + INTERVAL '120 days',
    NOW() + INTERVAL '120 days' - INTERVAL '1 hour',
    NOW() + INTERVAL '120 days' + INTERVAL '3 hours',
    75.00,
    'USD',
    400,
    6,
    'published',
    true,
    true,
    'b2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800'
),
-- Theater
(
    'c3333333-3333-3333-3333-333333333333',
    'Hamilton - The Musical',
    'hamilton-musical-2026',
    'The groundbreaking musical about Alexander Hamilton returns with a spectacular production. Experience the revolution like never before.',
    'The revolutionary musical about Alexander Hamilton.',
    'Richard Rodgers Theatre',
    '226 W 46th St',
    'New York',
    'NY',
    'USA',
    NOW() + INTERVAL '150 days',
    NOW() + INTERVAL '150 days' - INTERVAL '1 hour',
    NOW() + INTERVAL '150 days' + INTERVAL '3 hours',
    199.99,
    'USD',
    300,
    4,
    'published',
    true,
    true,
    'b2222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800'
),
-- Sports
(
    'c4444444-4444-4444-4444-444444444444',
    'NBA Finals Game 7',
    'nba-finals-game7-2026',
    'The ultimate basketball showdown! Watch the best teams battle for the championship in Game 7 of the NBA Finals.',
    'The ultimate championship basketball showdown.',
    'Crypto.com Arena',
    '1111 S Figueroa St',
    'Los Angeles',
    'CA',
    'USA',
    NOW() + INTERVAL '180 days',
    NOW() + INTERVAL '180 days' - INTERVAL '2 hours',
    NOW() + INTERVAL '180 days' + INTERVAL '3 hours',
    299.99,
    'USD',
    600,
    6,
    'published',
    true,
    true,
    'b2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800'
),
-- Comedy
(
    'c5555555-5555-5555-5555-555555555555',
    'Comedy Night with Dave Chappelle',
    'dave-chappelle-2026',
    'An evening of laughter with legendary comedian Dave Chappelle. Prepare for an unforgettable stand-up experience.',
    'Legendary stand-up comedy with Dave Chappelle.',
    'The Comedy Store',
    '8433 Sunset Blvd',
    'West Hollywood',
    'CA',
    'USA',
    NOW() + INTERVAL '60 days',
    NOW() + INTERVAL '60 days' - INTERVAL '1 hour',
    NOW() + INTERVAL '60 days' + INTERVAL '2 hours',
    125.00,
    'USD',
    200,
    4,
    'published',
    true,
    true,
    'b2222222-2222-2222-2222-222222222222',
    'a5555555-5555-5555-5555-555555555555',
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800'
),
-- Conference
(
    'c6666666-6666-6666-6666-666666666666',
    'Tech Summit 2026',
    'tech-summit-2026',
    'The premier technology conference featuring keynotes from industry leaders, workshops, and networking opportunities.',
    'Premier technology conference with industry leaders.',
    'Moscone Center',
    '747 Howard St',
    'San Francisco',
    'CA',
    'USA',
    NOW() + INTERVAL '200 days',
    NOW() + INTERVAL '200 days' - INTERVAL '1 hour',
    NOW() + INTERVAL '200 days' + INTERVAL '9 hours',
    599.99,
    'USD',
    1000,
    10,
    'published',
    true,
    true,
    'b2222222-2222-2222-2222-222222222222',
    'a4444444-4444-4444-4444-444444444444',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
),
-- Festival
(
    'c7777777-7777-7777-7777-777777777777',
    'Coachella Music Festival 2026',
    'coachella-2026',
    'The iconic music festival returns with an incredible lineup of artists across multiple stages in the California desert.',
    'The iconic desert music festival experience.',
    'Empire Polo Club',
    '81-800 Avenue 51',
    'Indio',
    'CA',
    'USA',
    NOW() + INTERVAL '100 days',
    NOW() + INTERVAL '100 days' - INTERVAL '1 hour',
    NOW() + INTERVAL '100 days' + INTERVAL '14 hours',
    449.99,
    'USD',
    800,
    8,
    'published',
    true,
    true,
    'b2222222-2222-2222-2222-222222222222',
    'a6666666-6666-6666-6666-666666666666',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800'
),
-- Taylor Swift
(
    'c8888888-8888-8888-8888-888888888888',
    'Taylor Swift - Eras Tour',
    'taylor-swift-eras-2026',
    'Join Taylor Swift on her record-breaking Eras Tour! Experience a journey through her iconic albums in this spectacular concert.',
    'Taylor Swift Eras Tour - a journey through her iconic albums.',
    'SoFi Stadium',
    '1001 Stadium Dr',
    'Inglewood',
    'CA',
    'USA',
    NOW() + INTERVAL '240 days',
    NOW() + INTERVAL '240 days' - INTERVAL '2 hours',
    NOW() + INTERVAL '240 days' + INTERVAL '4 hours',
    350.00,
    'USD',
    700,
    6,
    'published',
    true,
    true,
    'b2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800'
);

-- Generate seats for each event
-- Seats schema requires: seat_label, row_identifier, base_price, current_price
DO $$
DECLARE
    event_record RECORD;
    row_labels TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
    row_idx INTEGER;
    seat_num INTEGER;
    seats_per_row INTEGER := 25;
    total_rows INTEGER;
    section_name TEXT;
    seat_type TEXT;
    seat_price DECIMAL;
    event_base_price DECIMAL;
    seat_label_str TEXT;
BEGIN
    FOR event_record IN SELECT id, total_seats, base_price FROM events LOOP
        event_base_price := event_record.base_price;
        total_rows := LEAST(CEIL(event_record.total_seats::FLOAT / seats_per_row), 20);
        
        FOR row_idx IN 1..total_rows LOOP
            FOR seat_num IN 1..seats_per_row LOOP
                -- Exit if we've created enough seats
                EXIT WHEN ((row_idx - 1) * seats_per_row + seat_num) > event_record.total_seats;
                
                -- Determine section and pricing based on row
                IF row_idx <= 3 THEN
                    section_name := 'VIP';
                    seat_type := 'vip';
                    seat_price := event_base_price * 2.0;
                ELSIF row_idx <= 8 THEN
                    section_name := 'Premium';
                    seat_type := 'premium';
                    seat_price := event_base_price * 1.5;
                ELSIF row_idx <= 15 THEN
                    section_name := 'Standard';
                    seat_type := 'standard';
                    seat_price := event_base_price;
                ELSE
                    section_name := 'Economy';
                    seat_type := 'economy';
                    seat_price := event_base_price * 0.75;
                END IF;
                
                -- Generate seat label (e.g., "A-1", "B-12")
                seat_label_str := row_labels[row_idx] || '-' || seat_num;
                
                INSERT INTO seats (
                    event_id,
                    seat_label,
                    row_identifier,
                    seat_number,
                    section,
                    seat_type,
                    price_tier,
                    base_price,
                    current_price,
                    status,
                    is_wheelchair_accessible,
                    x_coordinate,
                    y_coordinate
                ) VALUES (
                    event_record.id,
                    seat_label_str,
                    row_labels[row_idx],
                    seat_num,
                    section_name,
                    seat_type,
                    seat_type,
                    ROUND(seat_price::NUMERIC, 2),
                    ROUND(seat_price::NUMERIC, 2),
                    'available',
                    (seat_num = 1 AND row_idx <= 3),  -- First seats in first 3 rows are accessible
                    seat_num * 30,  -- X coordinate based on seat number
                    row_idx * 30    -- Y coordinate based on row
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Update event seat counts to match actual seats created
UPDATE events e SET total_seats = (SELECT COUNT(*) FROM seats s WHERE s.event_id = e.id);

-- Re-enable triggers
ALTER TABLE users ENABLE TRIGGER audit_users_trigger;
ALTER TABLE events ENABLE TRIGGER audit_events_trigger;

-- Output summary
DO $$
DECLARE
    cat_count INTEGER;
    user_count INTEGER;
    event_count INTEGER;
    seat_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cat_count FROM event_categories;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO event_count FROM events;
    SELECT COUNT(*) INTO seat_count FROM seats;
    
    RAISE NOTICE '=== Seed Data Summary ===';
    RAISE NOTICE 'Categories: %', cat_count;
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE 'Events: %', event_count;
    RAISE NOTICE 'Seats: %', seat_count;
    RAISE NOTICE '========================';
END $$;

-- Show created events
SELECT id, title, venue_city, base_price, total_seats, status, is_featured 
FROM events ORDER BY event_date;
