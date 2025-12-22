const { Client } = require('pg');

const config = {
  host: '87.106.51.134',
  port: 5432,
  user: 'cosacerco_user',
  password: 'Z9pG3r!xA7fQ2mB0',
  database: 'cosacerco_db',
  ssl: false 
};

async function setup() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('Connected successfully to cosacerco_db');
    
    // Try to create a schema
    await client.query('CREATE SCHEMA IF NOT EXISTS erasmus_app');
    console.log('Schema erasmus_app created successfully (or already exists).');
    
  } catch (err) {
    console.error('Error during schema creation:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
