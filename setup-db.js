const { Client } = require('pg');

const config = {
  host: '87.106.51.134',
  port: 5432,
  user: 'cosacerco_user',
  password: 'Z9pG3r!xA7fQ2mB0',
  database: 'cosacerco_db', // Connect to existing DB to issue create command
  ssl: false // User didn't specify SSL, assuming false or allow.
};

async function setup() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('Connected successfully to cosacerco_db');
    
    // Check if erasmus_writer_db exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'erasmus_writer_db'");
    
    if (res.rowCount === 0) {
      console.log('Database erasmus_writer_db not found. Attempting to create...');
      // Cannot run CREATE DATABASE inside a transaction block if pg detects one, but here we are in auto-commit mode usually.
      await client.query('CREATE DATABASE erasmus_writer_db');
      console.log('Database erasmus_writer_db created successfully.');
    } else {
      console.log('Database erasmus_writer_db already exists.');
    }
  } catch (err) {
    console.error('Error during setup:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
