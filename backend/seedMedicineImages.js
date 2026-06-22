const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Medicine = require('./models/Medicine');
const { getSeedImageForMedicine } = require('./data/fdaMedicines');

dotenv.config();

async function seedMedicineImages() {
  await connectDB();

  const shouldForce = process.argv.includes('--force');
  const filter = shouldForce
    ? {}
    : {
        $or: [
          { imageUrl: { $exists: false } },
          { imageUrl: '' },
          { imageUrl: null },
        ],
      };

  const medicines = await Medicine.find(filter).select('_id name category imageUrl').lean();

  if (!medicines.length) {
    console.log(shouldForce ? 'No medicines found to refresh images.' : 'No medicines with missing images found.');
    process.exit(0);
  }

  let updatedCount = 0;

  for (const medicine of medicines) {
    const imageUrl = getSeedImageForMedicine(medicine);

    if (!imageUrl) {
      continue;
    }

    await Medicine.updateOne({ _id: medicine._id }, { $set: { imageUrl } });
    updatedCount += 1;
    console.log(`Seeded image for ${medicine.name} (${medicine.category})`);
  }

  console.log(`Medicine image seeding completed. Updated ${updatedCount} medicine(s).`);
  process.exit(0);
}

seedMedicineImages().catch((error) => {
  console.error('Medicine image seeding failed:', error.message);
  process.exit(1);
});
