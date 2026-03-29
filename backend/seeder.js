const dotenv = require('dotenv');
const User = require('./models/User');
const Medicine = require('./models/Medicine');
const connectDB = require('./config/db');
const { getSeedMedicines } = require('./data/fdaMedicines');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    const medicines = await getSeedMedicines();

    await User.deleteMany();
    await Medicine.deleteMany();

    await User.create({
      name: 'Bablu Owner',
      email: 'admin@bablu.com',
      password: 'admin123',
      role: 'admin',
    });

    await User.create({
      name: 'Ashu Yadav',
      email: 'ashu@test.com',
      password: 'password123',
      role: 'customer',
    });

    await Medicine.insertMany(medicines);

    console.log('Data imported successfully from openFDA-backed seed data.');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Medicine.deleteMany();

    console.log('Data destroyed.');
    process.exit();
  } catch (error) {
    console.error(`Error with data destruction: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
