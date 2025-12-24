-- Atomic pricing update script
-- This script updates seat pricing atomically with validation
-- KEYS[1] = seat_availability_hash_key (e.g., "seats:event:EVENT_ID")
-- KEYS[2] = pricing_history_key (e.g., "pricing_history:event:EVENT_ID")
-- ARGV[1] = pricing_updates (JSON encoded array of updates)
-- ARGV[2] = updated_by (user ID)
-- ARGV[3] = current_timestamp
-- ARGV[4] = validation_rules (JSON encoded object)

local pricing_updates = cjson.decode(ARGV[1])
local updated_by = ARGV[2]
local current_timestamp = tonumber(ARGV[3])
local validation_rules = cjson.decode(ARGV[4])

local seat_availability_key = KEYS[1]
local pricing_history_key = KEYS[2]

-- Function to validate price update
local function validate_price_update(seat, new_price, rules)
    -- Check minimum price
    if rules.min_price and new_price < rules.min_price then
        return false, "Price below minimum allowed: " .. rules.min_price
    end
    
    -- Check maximum price
    if rules.max_price and new_price > rules.max_price then
        return false, "Price above maximum allowed: " .. rules.max_price
    end
    
    -- Check maximum price increase percentage
    if rules.max_increase_percent then
        local current_price = tonumber(seat.current_price) or 0
        local increase_percent = ((new_price - current_price) / current_price) * 100
        if increase_percent > rules.max_increase_percent then
            return false, "Price increase exceeds maximum allowed: " .. rules.max_increase_percent .. "%"
        end
    end
    
    -- Check if seat is available for pricing changes
    if seat.status == 'booked' and not rules.allow_booked_seat_pricing then
        return false, "Cannot change price for booked seat"
    end
    
    return true, nil
end

-- Function to update seat price
local function update_seat_price(seat_id, new_price, price_tier)
    local seat_data = redis.call('HGET', seat_availability_key, seat_id)
    if not seat_data then
        return false, "Seat not found", nil
    end
    
    local seat = cjson.decode(seat_data)
    local old_price = tonumber(seat.current_price) or 0
    
    -- Validate price update
    local valid, error_msg = validate_price_update(seat, new_price, validation_rules)
    if not valid then
        return false, error_msg, nil
    end
    
    -- Create price history entry
    local price_history_entry = {
        seat_id = seat_id,
        old_price = old_price,
        new_price = new_price,
        old_price_tier = seat.price_tier,
        new_price_tier = price_tier,
        updated_by = updated_by,
        updated_at = current_timestamp,
        reason = "Manual price update"
    }
    
    -- Update seat pricing
    seat.current_price = new_price
    seat.price_tier = price_tier or seat.price_tier
    seat.last_price_update = current_timestamp
    seat.price_update_count = (seat.price_update_count or 0) + 1
    seat.updated_at = current_timestamp
    
    -- Save updated seat data
    redis.call('HSET', seat_availability_key, seat_id, cjson.encode(seat))
    
    return true, nil, {
        seat_id = seat_id,
        seat_label = seat.seat_label,
        old_price = old_price,
        new_price = new_price,
        price_tier = price_tier or seat.price_tier,
        price_history = price_history_entry
    }
end

-- Function to update seats by criteria
local function update_seats_by_criteria(criteria, new_price, price_tier)
    local updated_seats = {}
    local failed_updates = {}
    
    -- Get all seats for the event
    local all_seats = redis.call('HGETALL', seat_availability_key)
    
    for i = 1, #all_seats, 2 do
        local seat_id = all_seats[i]
        local seat_data = all_seats[i + 1]
        local seat = cjson.decode(seat_data)
        
        -- Check if seat matches criteria
        local matches = true
        
        if criteria.section and seat.section ~= criteria.section then
            matches = false
        end
        
        if criteria.price_tier and seat.price_tier ~= criteria.price_tier then
            matches = false
        end
        
        if criteria.row_identifier and seat.row_identifier ~= criteria.row_identifier then
            matches = false
        end
        
        if criteria.seat_type and seat.seat_type ~= criteria.seat_type then
            matches = false
        end
        
        if criteria.status and seat.status ~= criteria.status then
            matches = false
        end
        
        if matches then
            local success, error_msg, result = update_seat_price(seat_id, new_price, price_tier)
            if success then
                table.insert(updated_seats, result)
            else
                table.insert(failed_updates, {seat_id = seat_id, reason = error_msg})
            end
        end
    end
    
    return updated_seats, failed_updates
end

-- Process all pricing updates
local all_updated_seats = {}
local all_failed_updates = {}
local price_history_entries = {}

for i, update in ipairs(pricing_updates) do
    local updated_seats = {}
    local failed_updates = {}
    
    if update.seat_id then
        -- Update specific seat
        local success, error_msg, result = update_seat_price(update.seat_id, update.price, update.price_tier)
        if success then
            table.insert(updated_seats, result)
        else
            table.insert(failed_updates, {seat_id = update.seat_id, reason = error_msg})
        end
    elseif update.criteria then
        -- Update seats by criteria
        updated_seats, failed_updates = update_seats_by_criteria(update.criteria, update.price, update.price_tier)
    end
    
    -- Collect results
    for j, seat in ipairs(updated_seats) do
        table.insert(all_updated_seats, seat)
        table.insert(price_history_entries, seat.price_history)
    end
    
    for j, failure in ipairs(failed_updates) do
        table.insert(all_failed_updates, failure)
    end
end

-- Store price history
if #price_history_entries > 0 then
    local history_entry = {
        timestamp = current_timestamp,
        updated_by = updated_by,
        total_seats_updated = #all_updated_seats,
        updates = price_history_entries
    }
    
    -- Add to pricing history list (keep last 100 entries)
    redis.call('LPUSH', pricing_history_key, cjson.encode(history_entry))
    redis.call('LTRIM', pricing_history_key, 0, 99)
    redis.call('EXPIRE', pricing_history_key, 86400 * 30) -- 30 days
end

-- Update pricing cache timestamp
local pricing_cache_key = 'pricing_cache:' .. string.match(KEYS[1], ":event:(.+)")
redis.call('HSET', pricing_cache_key, 'last_updated', current_timestamp)
redis.call('EXPIRE', pricing_cache_key, 3600) -- 1 hour

return {
    success = true,
    updated_seats = all_updated_seats,
    failed_updates = all_failed_updates,
    total_updated = #all_updated_seats,
    total_failed = #all_failed_updates
}
