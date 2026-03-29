const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Medicine = require('./models/Medicine');
const { getSeedMedicines } = require('./data/fdaMedicines');

dotenv.config();

const users = [
  { name: 'Bablu Owner', email: 'admin@bablu.com', password: 'admin123', role: 'admin' },
  { name: 'Ashu Yadav', email: 'ashu@test.com', password: 'password123', role: 'customer' },
];

async function seed() {
  await connectDB();
  const medicines = await getSeedMedicines();

  for (const user of users) {
    const existingUser = await User.findOne({ email: user.email });
    if (!existingUser) {
      await User.create(user);
      console.log(`Created user: ${user.email}`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }

  for (const medicine of medicines) {
    const existingMedicine = await Medicine.findOne({ name: medicine.name });
    if (!existingMedicine) {
      await Medicine.create(medicine);
      console.log(`Added medicine: ${medicine.name}`);
    } else {
      await Medicine.updateOne({ _id: existingMedicine._id }, { $set: medicine });
      console.log(`Updated medicine: ${medicine.name}`);
    }
  }

  console.log('Safe seed completed.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Safe seed failed:', error.message);
  process.exit(1);
});
