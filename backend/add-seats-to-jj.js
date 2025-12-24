const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'eventmax',
  password: 'password',
  port: 5433,
});

async function addSeatsToEvent() {
  const client = await pool.connect();
  
  try {
    const eventId = '6bfda7fa-5058-41c5-a125-11d0f834e349'; // Event "jj"
    
    console.log('Adding seats to event "jj"...');
    
    const seatRows = ['A', 'B', 'C'];
    const seatsPerRow = 10;
    let totalSeats = 0;
    
    for (const row of seatRows) {
      for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
        await client.query(`
          INSERT INTO seats (event_id, seat_label, section, row, col, price, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          eventId,
          `${row}${seatNum}`,
          'General',
          row,
          seatNum,
          99.99, // Price for event "jj"
          'available'
        ]);
        totalSeats++;
      }
    }
    
    console.log(`✅ Added ${totalSeats} seats to event "jj"`);
    console.log('Frontend can now reserve seats for this event!');
    
  } catch (error) {
    console.error('Error adding seats:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addSeatsToEvent();
