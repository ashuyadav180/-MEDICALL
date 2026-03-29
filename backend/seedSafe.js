const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Medicine = require('./models/Medicine');

dotenv.config();

const medicines = [
  { name: 'Paracetamol 500mg', price: 25, description: 'Fever, headache, body pain', category: 'tablet', stock: 100 },
  { name: 'Crocin 650mg', price: 35, description: 'High fever, headache', category: 'tablet', stock: 50 },
  { name: 'Azithromycin 500mg', price: 85, description: 'Bacterial infections', category: 'tablet', stock: 30 },
  { name: 'Amoxicillin 500mg', price: 65, description: 'Throat, ear infections', category: 'capsule', stock: 40 },
  { name: 'Omeprazole 20mg', price: 45, description: 'Acidity, stomach pain', category: 'capsule', stock: 60 },
  { name: 'Metformin 500mg', price: 30, description: 'Diabetes (sugar)', category: 'tablet', stock: 80 },
  { name: 'Amlodipine 5mg', price: 40, description: 'Blood pressure (BP)', category: 'tablet', stock: 90 },
  { name: 'Cetirizine 10mg', price: 20, description: 'Allergy, cold, itching', category: 'tablet', stock: 120 },
  { name: 'Ibuprofen 400mg', price: 28, description: 'Pain, inflammation', category: 'tablet', stock: 70 },
  { name: 'Dolo 650', price: 32, description: 'Fever, pain relief', category: 'tablet', stock: 150 },
  { name: 'Benadryl Cough Syrup', price: 90, description: 'Cough, cold, congestion', category: 'syrup', stock: 25 },
  { name: 'Ascoril Syrup', price: 110, description: 'Dry & wet cough', category: 'syrup', stock: 20 },
  { name: 'Digene Syrup', price: 75, description: 'Acidity, gas, indigestion', category: 'syrup', stock: 45 },
  { name: 'ORS Sachet', price: 15, description: 'Dehydration, diarrhea', category: 'other', stock: 200 },
  { name: 'Betadine Ointment', price: 55, description: 'Wound, cut, infection', category: 'cream', stock: 35 },
  { name: 'Soframycin Cream', price: 60, description: 'Skin infection, burns', category: 'cream', stock: 40 },
  { name: 'Moov Pain Cream', price: 80, description: 'Joint pain, muscle pain', category: 'cream', stock: 55 },
  { name: 'Cipla Eye Drops', price: 70, description: 'Eye irritation, redness', category: 'drops', stock: 40 },
  { name: 'Otrivin Nasal Drops', price: 65, description: 'Blocked nose, cold', category: 'drops', stock: 30 },
  { name: 'Vitamin C 500mg', price: 50, description: 'Immunity booster', category: 'tablet', stock: 100 },
  { name: 'Calcium + Vit D3', price: 120, description: 'Bone health, weakness', category: 'tablet', stock: 60 },
  { name: 'Iron Folic Acid', price: 45, description: 'Anaemia, pregnancy', category: 'tablet', stock: 80 },
  { name: 'Glucon-D Sachet', price: 10, description: 'Energy, weakness', category: 'other', stock: 300 },
  { name: 'Disprin Tablet', price: 18, description: 'Headache, fever, cold', category: 'tablet', stock: 100 },
  { name: 'Antacid Tablet', price: 22, description: 'Acidity, heartburn', category: 'tablet', stock: 120 },
  { name: 'Insulin Injection', price: 250, description: 'Diabetes (as prescribed)', category: 'injection', stock: 15 },
  { name: 'B-Complex Tablet', price: 55, description: 'Vitamins, weakness', category: 'tablet', stock: 90 },
  { name: 'Clotrimazole Cream', price: 65, description: 'Fungal skin infection', category: 'cream', stock: 50 },
];

const users = [
  { name: 'Bablu Owner', email: 'admin@bablu.com', password: 'admin123', role: 'admin' },
  { name: 'Ashu Yadav', email: 'ashu@test.com', password: 'password123', role: 'customer' },
];

async function seed() {
  await connectDB();

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
      console.log(`Medicine already exists: ${medicine.name}`);
    }
  }

  console.log('Safe seed completed.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Safe seed failed:', error.message);
  process.exit(1);
});
