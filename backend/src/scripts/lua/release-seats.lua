-- Atomic seat release script
-- This script releases multiple seats atomically from a reservation
-- KEYS[1] = seat_availability_hash_key (e.g., "seats:event:EVENT_ID")
-- KEYS[2] = user_reservations_set_key (e.g., "user_reservations:USER_ID")
-- KEYS[3] = reservation_data_key (e.g., "reservation:RESERVATION_TOKEN")
-- ARGV[1] = user_id
-- ARGV[2] = reservation_token
-- ARGV[3] = current_timestamp
-- ARGV[4] = seat_ids (JSON encoded array)
-- ARGV[5] = admin_override (boolean)

local user_id = ARGV[1]
local reservation_token = ARGV[2]
local current_timestamp = tonumber(ARGV[3])
local seat_ids = cjson.decode(ARGV[4])
local admin_override = ARGV[5] == 'true'

local seat_availability_key = KEYS[1]
local user_reservations_key = KEYS[2]
local reservation_data_key = KEYS[3]

-- Function to release a seat
local function release_seat(seat_id)
    local seat_data = redis.call('HGET', seat_availability_key, seat_id)
    if not seat_data then
        return false, "Seat not found"
    end
    
    local seat = cjson.decode(seat_data)
    
    -- Verify ownership (unless admin override)
    if not admin_override then
        if seat.status ~= 'reserved' or seat.reserved_by ~= user_id or seat.reservation_token ~= reservation_token then
            return false, "Not authorized to release this seat"
        end
    end
    
    -- Only release if currently reserved (not booked)
    if seat.status == 'booked' then
        return false, "Cannot release booked seat"
    end
    
    -- Update seat status
    seat.status = 'available'
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
        row = seat.row_identifier
    }
end

-- Release all seats
local released_seats = {}
local failed_releases = {}

for i, seat_id in ipairs(seat_ids) do
    local success, result = release_seat(seat_id)
    if success then
        table.insert(released_seats, result)
    else
        table.insert(failed_releases, {seat_id = seat_id, reason = result})
    end
end

-- Remove reservation data
redis.call('DEL', reservation_data_key)

-- Remove reservation token from user's active reservations
redis.call('SREM', user_reservations_key, reservation_token)

-- Clean up expired reservation tokens
local all_tokens = redis.call('SMEMBERS', user_reservations_key)
local valid_tokens = {}
for i, token in ipairs(all_tokens) do
    local token_key = 'reservation:' .. token
    if redis.call('EXISTS', token_key) == 1 then
        table.insert(valid_tokens, token)
    end
end

-- Update user reservations set with only valid tokens
redis.call('DEL', user_reservations_key)
if #valid_tokens > 0 then
    redis.call('SADD', user_reservations_key, unpack(valid_tokens))
    redis.call('EXPIRE', user_reservations_key, 3600) -- 1 hour
end

return {
    success = true,
    released_seats = released_seats,
    failed_releases = failed_releases,
    total_released = #released_seats
}
