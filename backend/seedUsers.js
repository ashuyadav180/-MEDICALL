const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const users = [
  { name: 'Bablu Owner', email: 'admin@bablu.com', password: 'AMIT@937149', role: 'admin' },
  { name: 'Ashu Yadav', email: 'ashu@test.com', password: 'password123', role: 'customer' },
  {
    name: 'Delivery Partner',
    email: 'delivery@bablu.com',
    password: 'AMIT@937149',
    role: 'delivery_person',
    phone: '9876543210',
  },
];

async function seedUsers() {
  await connectDB();

  for (const nextUser of users) {
    const existingUser = await User.findOne({ email: nextUser.email });

    if (!existingUser) {
      await User.create(nextUser);
      console.log(`Created user: ${nextUser.email}`);
      continue;
    }

    existingUser.name = nextUser.name;
    existingUser.role = nextUser.role;
    existingUser.password = nextUser.password;

    if (nextUser.phone) {
      existingUser.phone = nextUser.phone;
    }

    await existingUser.save();
    console.log(`Updated user: ${nextUser.email}`);
  }

  console.log('User seed completed.');
  process.exit(0);
}

seedUsers().catch((error) => {
  console.error('User seed failed:', error.message);
  process.exit(1);
});
