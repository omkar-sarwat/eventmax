-- Atomic seat confirmation script
-- This script confirms seat reservations into bookings atomically
-- KEYS[1] = seat_availability_hash_key (e.g., "seats:event:EVENT_ID")
-- KEYS[2] = user_reservations_set_key (e.g., "user_reservations:USER_ID")
-- KEYS[3] = reservation_data_key (e.g., "reservation:RESERVATION_TOKEN")
-- ARGV[1] = user_id
-- ARGV[2] = reservation_token
-- ARGV[3] = booking_id
-- ARGV[4] = current_timestamp
-- ARGV[5] = seat_ids (JSON encoded array)

local user_id = ARGV[1]
local reservation_token = ARGV[2]
local booking_id = ARGV[3]
local current_timestamp = tonumber(ARGV[4])
local seat_ids = cjson.decode(ARGV[5])

local seat_availability_key = KEYS[1]
local user_reservations_key = KEYS[2]
local reservation_data_key = KEYS[3]

-- Function to confirm a seat reservation
local function confirm_seat(seat_id)
    local seat_data = redis.call('HGET', seat_availability_key, seat_id)
    if not seat_data then
        return false, "Seat not found"
    end
    
    local seat = cjson.decode(seat_data)
    
    -- Verify reservation ownership
    if seat.status ~= 'reserved' or seat.reserved_by ~= user_id or seat.reservation_token ~= reservation_token then
        return false, "Seat is not reserved by this user"
    end
    
    -- Check if reservation is still valid (not expired)
    if seat.reserved_until and seat.reserved_until < current_timestamp then
        return false, "Reservation has expired"
    end
    
    -- Update seat status to booked
    seat.status = 'booked'
    seat.current_booking_id = booking_id
    seat.last_booking_id = booking_id
    seat.last_booked_at = current_timestamp
    seat.total_bookings = (seat.total_bookings or 0) + 1
    seat.reserved_by = nil
    seat.reserved_until = nil
    seat.reservation_token = nil
    seat.updated_at = current_timestamp
    
    -- Save updated seat data
    redis.call('HSET', seat_availability_key, seat_id, cjson.encode(seat))
    
    return true, {
        seat_id = seat_id,
        seat_label = seat.seat_label,
        section = seat.section,
        row = seat.row_identifier,
        price = seat.current_price
    }
end

-- Validate reservation exists
local reservation_data = redis.call('GET', reservation_data_key)
if not reservation_data then
    return {
        success = false,
        error = "Reservation not found or expired"
    }
end

local reservation = cjson.decode(reservation_data)

-- Verify ownership
if reservation.user_id ~= user_id then
    return {
        success = false,
        error = "Not authorized to confirm this reservation"
    }
end

-- Confirm all seats
local confirmed_seats = {}
local failed_confirmations = {}

for i, seat_id in ipairs(seat_ids) do
    local success, result = confirm_seat(seat_id)
    if success then
        table.insert(confirmed_seats, result)
    else
        table.insert(failed_confirmations, {seat_id = seat_id, reason = result})
    end
end

-- If any confirmations failed, rollback all changes
if #failed_confirmations > 0 then
    -- Rollback: convert any confirmed seats back to reserved
    for i, confirmed_seat in ipairs(confirmed_seats) do
        local seat_data = redis.call('HGET', seat_availability_key, confirmed_seat.seat_id)
        local seat = cjson.decode(seat_data)
        
        seat.status = 'reserved'
        seat.current_booking_id = nil
        seat.reserved_by = user_id
        seat.reserved_until = reservation.expires_at
        seat.reservation_token = reservation_token
        seat.updated_at = current_timestamp
        
        redis.call('HSET', seat_availability_key, confirmed_seat.seat_id, cjson.encode(seat))
    end
    
    return {
        success = false,
        error = "Some seats could not be confirmed",
        failed_confirmations = failed_confirmations
    }
end

-- All seats confirmed successfully
-- Update reservation status
reservation.status = 'confirmed'
reservation.booking_id = booking_id
reservation.confirmed_at = current_timestamp

-- Store updated reservation (with longer expiry for audit trail)
redis.call('SETEX', reservation_data_key, 86400, cjson.encode(reservation)) -- 24 hours

-- Remove reservation token from user's active reservations
redis.call('SREM', user_reservations_key, reservation_token)

-- Create booking confirmation record
local booking_confirmation_key = 'booking_confirmation:' .. booking_id
redis.call('SETEX', booking_confirmation_key, 86400, cjson.encode({
    booking_id = booking_id,
    user_id = user_id,
    reservation_token = reservation_token,
    confirmed_seats = confirmed_seats,
    confirmed_at = current_timestamp
}))

return {
    success = true,
    booking_id = booking_id,
    confirmed_seats = confirmed_seats,
    total_confirmed = #confirmed_seats
}
