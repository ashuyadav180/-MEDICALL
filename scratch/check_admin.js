/**
 * check_admin.js
 * Check if the admin user is correctly stored in the MongoDB database
 */
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');

// Define a simple schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
});
const User = mongoose.model('User', UserSchema);

async function run() {
  const uri = process.env.MONGO_URI;
  console.log('Connecting to Mongo:', uri.replace(/:([^@]+)@/, ':****@')); // mask password

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    const users = await User.find({});
    console.log(`Found ${users.length} users in the database:`);
    users.forEach(u => {
      console.log(`- Email: ${u.email}, Role: ${u.role}, Name: ${u.name}`);
    });
  } catch (error) {
    console.error('Error connecting or querying:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
