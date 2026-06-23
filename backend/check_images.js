const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('./models/Medicine');

dotenv.config();

async function checkImages() {
    await mongoose.connect(process.env.MONGO_URI);
    const medicines = await Medicine.find({}).limit(5);
    console.log('Sample medicine images:', medicines.map(m => ({ name: m.name, imageUrl: m.imageUrl })));
    process.exit(0);
}

checkImages();
