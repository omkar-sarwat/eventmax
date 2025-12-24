-- Atomic seat reservation script
-- This script reserves multiple seats atomically, ensuring all or none are reserved
-- KEYS[1] = seat_availability_hash_key (e.g., "seats:event:EVENT_ID")
-- KEYS[2] = user_reservations_set_key (e.g., "user_reservations:USER_ID")
-- KEYS[3] = reservation_data_key (e.g., "reservation:RESERVATION_TOKEN")
-- ARGV[1] = user_id
-- ARGV[2] = reservation_token
-- ARGV[3] = expiry_seconds
-- ARGV[4] = current_timestamp
-- ARGV[5] = seat_ids (JSON encoded array)
-- ARGV[6] = reservation_data (JSON encoded object)

local user_id = ARGV[1]
local reservation_token = ARGV[2]
local expiry_seconds = tonumber(ARGV[3])
local current_timestamp = tonumber(ARGV[4])
local seat_ids = cjson.decode(ARGV[5])
local reservation_data = ARGV[6]

local seat_availability_key = KEYS[1]
local user_reservations_key = KEYS[2]
local reservation_data_key = KEYS[3]

-- Function to check if a seat is available
local function is_seat_available(seat_id)
    local seat_data = redis.call('HGET', seat_availability_key, seat_id)
    if not seat_data then
        return false, "Seat not found"
    end
    
    local seat = cjson.decode(seat_data)
    
    -- Check if seat is available
    if seat.status == 'available' then
        return true, nil
    end
    
    -- Check if seat is reserved by the same user and not expired
    if seat.status == 'reserved' and seat.reserved_by == user_id then
        if seat.reserved_until and tonumber(seat.reserved_until) > current_timestamp then
            return true, nil
        end
    end
    
    return false, "Seat is " .. seat.status
end

-- Function to reserve a seat
local function reserve_seat(seat_id)
    local seat_data = redis.call('HGET', seat_availability_key, seat_id)
    local seat = cjson.decode(seat_data)
    
    -- Update seat status
    seat.status = 'reserved'
    seat.reserved_by = user_id
    seat.reserved_until = current_timestamp + expiry_seconds
    seat.reservation_token = reservation_token
    seat.updated_at = current_timestamp
    
    -- Save updated seat data
    redis.call('HSET', seat_availability_key, seat_id, cjson.encode(seat))
    
    return seat
end

-- Validate all seats first
local unavailable_seats = {}
for i, seat_id in ipairs(seat_ids) do
    local available, reason = is_seat_available(seat_id)
    if not available then
        table.insert(unavailable_seats, {seat_id = seat_id, reason = reason})
    end
end

-- If any seats are unavailable, return error
if #unavailable_seats > 0 then
    return {
        success = false,
        error = "Some seats are not available",
        unavailable_seats = unavailable_seats
    }
end

-- All seats are available, proceed with reservation
local reserved_seats = {}
for i, seat_id in ipairs(seat_ids) do
    local seat = reserve_seat(seat_id)
    table.insert(reserved_seats, {
        seat_id = seat_id,
        seat_label = seat.seat_label,
        section = seat.section,
        row = seat.row_identifier,
        price = seat.current_price
    })
end

-- Store reservation data with expiry
redis.call('SETEX', reservation_data_key, expiry_seconds, reservation_data)

-- Add reservation token to user's active reservations
redis.call('SADD', user_reservations_key, reservation_token)
redis.call('EXPIRE', user_reservations_key, expiry_seconds)

-- Set expiry for the entire seat availability hash (refresh TTL)
redis.call('EXPIRE', seat_availability_key, 86400) -- 24 hours

return {
    success = true,
    reservation_token = reservation_token,
    reserved_seats = reserved_seats,
    expires_at = current_timestamp + expiry_seconds
}
