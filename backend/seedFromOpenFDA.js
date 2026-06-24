/**
 * seedFromOpenFDA.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches medicine data from OpenFDA drug label endpoint and DailyMed media
 * endpoint to populate the database with:
 *   • Real FDA descriptions / manufacturer names
 *   • Real drug package images (from DailyMed via set_id)
 *   • Curated Unsplash fallback when DailyMed has no image
 *
 * Usage:
 *   node seedFromOpenFDA.js            # only update medicines missing images
 *   node seedFromOpenFDA.js --force    # update ALL 120 medicines
 *   node seedFromOpenFDA.js --dry-run  # print what would change, no DB writes
 * ─────────────────────────────────────────────────────────────────────────────
 */

const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const Medicine = require('./models/Medicine');
const { getSeedImageForMedicine } = require('./data/fdaMedicines');

// ─── Config ───────────────────────────────────────────────────────────────────
const FORCE     = process.argv.includes('--force');
const DRY_RUN   = process.argv.includes('--dry-run');
const DELAY_MS  = 400; // between each medicine to be kind to public APIs
const BATCH_MS  = 1200; // extra pause between every 10 medicines

const OPENFDA_BASE   = 'https://api.fda.gov/drug/label.json';
const DAILYMED_BASE  = 'https://dailymed.nlm.nih.gov/dailymed/services/v2';
const DAILYMED_IMG   = 'https://dailymed.nlm.nih.gov/dailymed/image.cfm';

// ─── Medicine list (must stay in same order as fdaMedicines.js MEDICINE_QUERIES)
const MEDICINE_QUERIES = [
  // TABLETS (20)
  { searchTerm: 'acetaminophen',        displayName: 'Paracetamol / Acetaminophen 500mg', category: 'tablet',    price: 25,  stock: 100, dosage: '500 mg',     packQuantity: 10,  packUnit: 'tablets' },
  { searchTerm: 'ibuprofen',            displayName: 'Ibuprofen 400mg',                   category: 'tablet',    price: 32,  stock: 75,  dosage: '400 mg',     packQuantity: 10,  packUnit: 'tablets' },
  { searchTerm: 'cetirizine',           displayName: 'Cetirizine 10mg',                   category: 'tablet',    price: 22,  stock: 120, dosage: '10 mg',      packQuantity: 10,  packUnit: 'tablets' },
  { searchTerm: 'metformin',            displayName: 'Metformin 500mg',                   category: 'tablet',    price: 30,  stock: 90,  dosage: '500 mg',     packQuantity: 15,  packUnit: 'tablets' },
  { searchTerm: 'amlodipine',           displayName: 'Amlodipine 5mg',                    category: 'tablet',    price: 40,  stock: 90,  dosage: '5 mg',       packQuantity: 10,  packUnit: 'tablets' },
  { searchTerm: 'lisinopril',           displayName: 'Lisinopril 10mg',                   category: 'tablet',    price: 45,  stock: 80,  dosage: '10 mg',      packQuantity: 28,  packUnit: 'tablets' },
  { searchTerm: 'atorvastatin',         displayName: 'Atorvastatin 20mg',                 category: 'tablet',    price: 55,  stock: 65,  dosage: '20 mg',      packQuantity: 30,  packUnit: 'tablets' },
  { searchTerm: 'levothyroxine',        displayName: 'Levothyroxine 100mcg',              category: 'tablet',    price: 38,  stock: 110, dosage: '100 mcg',    packQuantity: 30,  packUnit: 'tablets' },
  { searchTerm: 'losartan',             displayName: 'Losartan 50mg',                     category: 'tablet',    price: 42,  stock: 70,  dosage: '50 mg',      packQuantity: 30,  packUnit: 'tablets' },
  { searchTerm: 'albuterol',            displayName: 'Albuterol Tablet 4mg',              category: 'tablet',    price: 28,  stock: 50,  dosage: '4 mg',       packQuantity: 10,  packUnit: 'tablets' },
  { searchTerm: 'prednisone',           displayName: 'Prednisone 5mg',                    category: 'tablet',    price: 15,  stock: 150, dosage: '5 mg',       packQuantity: 10,  packUnit: 'tablets' },
  { searchTerm: 'gabapentin',           displayName: 'Gabapentin 300mg',                  category: 'tablet',    price: 60,  stock: 40,  dosage: '300 mg',     packQuantity: 30,  packUnit: 'tablets' },
  { searchTerm: 'amoxicillin',          displayName: 'Amoxicillin Tablet 500mg',          category: 'tablet',    price: 35,  stock: 100, dosage: '500 mg',     packQuantity: 20,  packUnit: 'tablets' },
  { searchTerm: 'sertraline',           displayName: 'Sertraline 50mg',                   category: 'tablet',    price: 50,  stock: 55,  dosage: '50 mg',      packQuantity: 30,  packUnit: 'tablets' },
  { searchTerm: 'montelukast',          displayName: 'Montelukast 10mg',                  category: 'tablet',    price: 33,  stock: 85,  dosage: '10 mg',      packQuantity: 30,  packUnit: 'tablets' },
  { searchTerm: 'meloxicam',            displayName: 'Meloxicam 15mg',                    category: 'tablet',    price: 24,  stock: 95,  dosage: '15 mg',      packQuantity: 10,  packUnit: 'tablets' },
  { searchTerm: 'pantoprazole',         displayName: 'Pantoprazole 40mg',                 category: 'tablet',    price: 39,  stock: 75,  dosage: '40 mg',      packQuantity: 30,  packUnit: 'tablets' },
  { searchTerm: 'furosemide',           displayName: 'Furosemide 40mg',                   category: 'tablet',    price: 18,  stock: 130, dosage: '40 mg',      packQuantity: 20,  packUnit: 'tablets' },
  { searchTerm: 'clopidogrel',          displayName: 'Clopidogrel 75mg',                  category: 'tablet',    price: 48,  stock: 60,  dosage: '75 mg',      packQuantity: 28,  packUnit: 'tablets' },
  { searchTerm: 'tamsulosin',           displayName: 'Tamsulosin 0.4mg',                  category: 'tablet',    price: 52,  stock: 45,  dosage: '0.4 mg',     packQuantity: 30,  packUnit: 'tablets' },
  // CAPSULES (20)
  { searchTerm: 'omeprazole',           displayName: 'Omeprazole 20mg',                   category: 'capsule',   price: 48,  stock: 60,  dosage: '20 mg',      packQuantity: 15,  packUnit: 'capsules' },
  { searchTerm: 'amoxicillin',          displayName: 'Amoxicillin 500mg',                 category: 'capsule',   price: 65,  stock: 45,  dosage: '500 mg',     packQuantity: 15,  packUnit: 'capsules' },
  { searchTerm: 'fluoxetine',           displayName: 'Fluoxetine 20mg',                   category: 'capsule',   price: 35,  stock: 80,  dosage: '20 mg',      packQuantity: 30,  packUnit: 'capsules' },
  { searchTerm: 'duloxetine',           displayName: 'Duloxetine 30mg',                   category: 'capsule',   price: 58,  stock: 40,  dosage: '30 mg',      packQuantity: 30,  packUnit: 'capsules' },
  { searchTerm: 'venlafaxine',          displayName: 'Venlafaxine 75mg',                  category: 'capsule',   price: 62,  stock: 35,  dosage: '75 mg',      packQuantity: 30,  packUnit: 'capsules' },
  { searchTerm: 'celecoxib',            displayName: 'Celecoxib 200mg',                   category: 'capsule',   price: 75,  stock: 25,  dosage: '200 mg',     packQuantity: 10,  packUnit: 'capsules' },
  { searchTerm: 'doxycycline',          displayName: 'Doxycycline 100mg',                 category: 'capsule',   price: 45,  stock: 60,  dosage: '100 mg',     packQuantity: 10,  packUnit: 'capsules' },
  { searchTerm: 'clindamycin',          displayName: 'Clindamycin 300mg',                 category: 'capsule',   price: 82,  stock: 20,  dosage: '300 mg',     packQuantity: 15,  packUnit: 'capsules' },
  { searchTerm: 'gabapentin',           displayName: 'Gabapentin Capsule 300mg',          category: 'capsule',   price: 55,  stock: 50,  dosage: '300 mg',     packQuantity: 30,  packUnit: 'capsules' },
  { searchTerm: 'tamsulosin',           displayName: 'Tamsulosin Capsule 0.4mg',          category: 'capsule',   price: 58,  stock: 45,  dosage: '0.4 mg',     packQuantity: 30,  packUnit: 'capsules' },
  { searchTerm: 'nitrofurantoin',       displayName: 'Nitrofurantoin 100mg',              category: 'capsule',   price: 68,  stock: 30,  dosage: '100 mg',     packQuantity: 14,  packUnit: 'capsules' },
  { searchTerm: 'minocycline',          displayName: 'Minocycline 50mg',                  category: 'capsule',   price: 92,  stock: 15,  dosage: '50 mg',      packQuantity: 30,  packUnit: 'capsules' },
  { searchTerm: 'pregabalin',           displayName: 'Pregabalin 75mg',                   category: 'capsule',   price: 72,  stock: 40,  dosage: '75 mg',      packQuantity: 14,  packUnit: 'capsules' },
  { searchTerm: 'atomoxetine',          displayName: 'Atomoxetine 40mg',                  category: 'capsule',   price: 110, stock: 10,  dosage: '40 mg',      packQuantity: 30,  packUnit: 'capsules' },
  { searchTerm: 'fluconazole',          displayName: 'Fluconazole 150mg',                 category: 'capsule',   price: 45,  stock: 90,  dosage: '150 mg',     packQuantity: 1,   packUnit: 'capsule' },
  { searchTerm: 'lansoprazole',         displayName: 'Lansoprazole 30mg',                 category: 'capsule',   price: 52,  stock: 55,  dosage: '30 mg',      packQuantity: 30,  packUnit: 'capsules' },
  { searchTerm: 'cephalexin',           displayName: 'Cephalexin 500mg',                  category: 'capsule',   price: 38,  stock: 70,  dosage: '500 mg',     packQuantity: 20,  packUnit: 'capsules' },
  { searchTerm: 'azithromycin',         displayName: 'Azithromycin Capsule 250mg',        category: 'capsule',   price: 95,  stock: 25,  dosage: '250 mg',     packQuantity: 6,   packUnit: 'capsules' },
  { searchTerm: 'itraconazole',         displayName: 'Itraconazole 100mg',                category: 'capsule',   price: 125, stock: 15,  dosage: '100 mg',     packQuantity: 10,  packUnit: 'capsules' },
  { searchTerm: 'ergocalciferol',       displayName: 'Vitamin D3 60K',                    category: 'capsule',   price: 30,  stock: 200, dosage: '60000 IU',   packQuantity: 4,   packUnit: 'capsules' },
  // SYRUPS (20)
  { searchTerm: 'dextromethorphan',     displayName: 'Cough Relief Syrup',                category: 'syrup',     price: 95,  stock: 35,  dosage: '100 ml',     packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'acetaminophen',        displayName: 'Paracetamol Pediatric Syrup',       category: 'syrup',     price: 45,  stock: 120, dosage: '60 ml',      packQuantity: 60,  packUnit: 'ml' },
  { searchTerm: 'ambroxol',             displayName: 'Ambroxol Syrup 30mg/5ml',           category: 'syrup',     price: 78,  stock: 50,  dosage: '100 ml',     packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'albuterol',            displayName: 'Salbutamol Syrup',                  category: 'syrup',     price: 35,  stock: 80,  dosage: '100 ml',     packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'levocetirizine',       displayName: 'Levocetirizine Syrup',              category: 'syrup',     price: 62,  stock: 65,  dosage: '60 ml',      packQuantity: 60,  packUnit: 'ml' },
  { searchTerm: 'sucralfate',           displayName: 'Sucralfate Suspension',             category: 'syrup',     price: 120, stock: 25,  dosage: '200 ml',     packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'multivitamin',         displayName: 'Multivitamin Health Tonic',         category: 'syrup',     price: 150, stock: 40,  dosage: '225 ml',     packQuantity: 225, packUnit: 'ml' },
  { searchTerm: 'magnesium hydroxide',  displayName: 'Milk of Magnesia',                  category: 'syrup',     price: 85,  stock: 60,  dosage: '170 ml',     packQuantity: 170, packUnit: 'ml' },
  { searchTerm: 'guaifenesin',          displayName: 'Ayurvedic Cough Syrup',             category: 'syrup',     price: 110, stock: 45,  dosage: '100 ml',     packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'ferrous sulfate',      displayName: 'Iron & Folic Acid Syrup',           category: 'syrup',     price: 175, stock: 30,  dosage: '200 ml',     packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'calcium carbonate',    displayName: 'Calcium Syrup with Vit D3',         category: 'syrup',     price: 135, stock: 55,  dosage: '200 ml',     packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'potassium citrate',    displayName: 'Alkalizer Syrup',                   category: 'syrup',     price: 92,  stock: 70,  dosage: '100 ml',     packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'cyproheptadine',       displayName: 'Appetite Stimulant Syrup',          category: 'syrup',     price: 105, stock: 40,  dosage: '200 ml',     packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'lactulose',            displayName: 'Lactulose Oral Solution',           category: 'syrup',     price: 210, stock: 20,  dosage: '200 ml',     packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'ondansetron',          displayName: 'Ondansetron Drops',                 category: 'syrup',     price: 48,  stock: 100, dosage: '30 ml',      packQuantity: 30,  packUnit: 'ml' },
  { searchTerm: 'domperidone',          displayName: 'Domperidone Suspension',            category: 'syrup',     price: 55,  stock: 85,  dosage: '30 ml',      packQuantity: 30,  packUnit: 'ml' },
  { searchTerm: 'albendazole',          displayName: 'Albendazole Oral Suspension',       category: 'syrup',     price: 28,  stock: 150, dosage: '10 ml',      packQuantity: 10,  packUnit: 'ml' },
  { searchTerm: 'metronidazole',        displayName: 'Metronidazole Suspension',          category: 'syrup',     price: 42,  stock: 95,  dosage: '60 ml',      packQuantity: 60,  packUnit: 'ml' },
  { searchTerm: 'thiamine',             displayName: 'B-Complex Syrup',                   category: 'syrup',     price: 88,  stock: 110, dosage: '200 ml',     packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'aluminum hydroxide',   displayName: 'Mint Antacid Liquid',               category: 'syrup',     price: 75,  stock: 130, dosage: '170 ml',     packQuantity: 170, packUnit: 'ml' },
  // CREAMS (20)
  { searchTerm: 'clotrimazole',         displayName: 'Clotrimazole Cream',                category: 'cream',     price: 68,  stock: 40,  dosage: '1% w/w',     packQuantity: 30,  packUnit: 'g' },
  { searchTerm: 'diclofenac',           displayName: 'Pain Relief Gel',                   category: 'cream',     price: 85,  stock: 55,  dosage: '30 g',       packQuantity: 30,  packUnit: 'g' },
  { searchTerm: 'hydrocortisone',       displayName: 'Hydrocortisone Cream 1%',           category: 'cream',     price: 42,  stock: 100, dosage: '15 g',       packQuantity: 15,  packUnit: 'g' },
  { searchTerm: 'mupirocin',            displayName: 'Mupirocin Ointment',                category: 'cream',     price: 145, stock: 25,  dosage: '5 g',        packQuantity: 5,   packUnit: 'g' },
  { searchTerm: 'ketoconazole',         displayName: 'Ketoconazole Cream 2%',             category: 'cream',     price: 115, stock: 35,  dosage: '30 g',       packQuantity: 30,  packUnit: 'g' },
  { searchTerm: 'adapalene',            displayName: 'Adapalene Gel 0.1%',                category: 'cream',     price: 210, stock: 20,  dosage: '15 g',       packQuantity: 15,  packUnit: 'g' },
  { searchTerm: 'benzoyl peroxide',     displayName: 'Benzoyl Peroxide Gel 5%',           category: 'cream',     price: 125, stock: 45,  dosage: '20 g',       packQuantity: 20,  packUnit: 'g' },
  { searchTerm: 'betamethasone',        displayName: 'Betamethasone Skin Cream',          category: 'cream',     price: 38,  stock: 90,  dosage: '20 g',       packQuantity: 20,  packUnit: 'g' },
  { searchTerm: 'fusidic acid',         displayName: 'Fusidic Acid Cream',                category: 'cream',     price: 155, stock: 30,  dosage: '10 g',       packQuantity: 10,  packUnit: 'g' },
  { searchTerm: 'terbinafine',          displayName: 'Terbinafine Cream 1%',              category: 'cream',     price: 135, stock: 40,  dosage: '10 g',       packQuantity: 10,  packUnit: 'g' },
  { searchTerm: 'permethrin',           displayName: 'Permethrin Cream 5%',               category: 'cream',     price: 95,  stock: 60,  dosage: '30 g',       packQuantity: 30,  packUnit: 'g' },
  { searchTerm: 'silver sulfadiazine',  displayName: 'Silver Sulfadiazine Burn Cream',    category: 'cream',     price: 110, stock: 50,  dosage: '25 g',       packQuantity: 25,  packUnit: 'g' },
  { searchTerm: 'miconazole',           displayName: 'Miconazole Nitrate Cream',          category: 'cream',     price: 72,  stock: 75,  dosage: '15 g',       packQuantity: 15,  packUnit: 'g' },
  { searchTerm: 'tretinoin',            displayName: 'Tretinoin Cream 0.025%',            category: 'cream',     price: 185, stock: 25,  dosage: '20 g',       packQuantity: 20,  packUnit: 'g' },
  { searchTerm: 'beclomethasone',       displayName: 'Beclomethasone Dipropionate',       category: 'cream',     price: 45,  stock: 110, dosage: '15 g',       packQuantity: 15,  packUnit: 'g' },
  { searchTerm: 'clobetasol',           displayName: 'Clobetasol Propionate Ointment',    category: 'cream',     price: 58,  stock: 95,  dosage: '30 g',       packQuantity: 30,  packUnit: 'g' },
  { searchTerm: 'povidone-iodine',      displayName: 'Antiseptic Ointment',               category: 'cream',     price: 65,  stock: 120, dosage: '15 g',       packQuantity: 15,  packUnit: 'g' },
  { searchTerm: 'heparin',              displayName: 'Thrombophob Gel',                   category: 'cream',     price: 142, stock: 30,  dosage: '20 g',       packQuantity: 20,  packUnit: 'g' },
  { searchTerm: 'calamine',             displayName: 'Calamine Lotion',                   category: 'cream',     price: 88,  stock: 85,  dosage: '100 ml',     packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'aloe vera',            displayName: 'Soothing Aloe Vera Gel',            category: 'cream',     price: 120, stock: 70,  dosage: '150 g',      packQuantity: 150, packUnit: 'g' },
  // DROPS (20)
  { searchTerm: 'carboxymethylcellulose', displayName: 'Lubricating Eye Drops',           category: 'drops',     price: 145, stock: 50,  dosage: '10 ml',      packQuantity: 10,  packUnit: 'ml' },
  { searchTerm: 'timolol',              displayName: 'Timolol Eye Drops 0.5%',            category: 'drops',     price: 92,  stock: 40,  dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'ciprofloxacin',        displayName: 'Cipro Ear/Eye Drops',               category: 'drops',     price: 35,  stock: 150, dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'naphazoline',          displayName: 'Naphazoline Eye Drops',             category: 'drops',     price: 48,  stock: 120, dosage: '10 ml',      packQuantity: 10,  packUnit: 'ml' },
  { searchTerm: 'brimonidine',          displayName: 'Brimonidine Eye Drops 0.2%',        category: 'drops',     price: 210, stock: 25,  dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'loteprednol',          displayName: 'Loteprednol Eye Drops',             category: 'drops',     price: 345, stock: 15,  dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'moxifloxacin',         displayName: 'Moxifloxacin Eye Drops',            category: 'drops',     price: 125, stock: 65,  dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'xylometazoline',       displayName: 'Nasal Decongestant Drops',          category: 'drops',     price: 55,  stock: 95,  dosage: '10 ml',      packQuantity: 10,  packUnit: 'ml' },
  { searchTerm: 'sodium chloride',      displayName: 'Saline Nasal Drops',                category: 'drops',     price: 28,  stock: 200, dosage: '15 ml',      packQuantity: 15,  packUnit: 'ml' },
  { searchTerm: 'ofloxacin',            displayName: 'Ofloxacin Ear Drops',               category: 'drops',     price: 42,  stock: 110, dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'prednisolone',         displayName: 'Prednisolone Eye Drops',            category: 'drops',     price: 85,  stock: 55,  dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'gentamicin',           displayName: 'Gentamicin Eye/Ear Drops',          category: 'drops',     price: 22,  stock: 180, dosage: '10 ml',      packQuantity: 10,  packUnit: 'ml' },
  { searchTerm: 'flurbiprofen',         displayName: 'Flurbiprofen Eye Drops',            category: 'drops',     price: 115, stock: 35,  dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'olopatadine',          displayName: 'Olopatadine Eye Drops',             category: 'drops',     price: 195, stock: 30,  dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'dorzolamide',          displayName: 'Dorzolamide Eye Drops',             category: 'drops',     price: 255, stock: 20,  dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'tobramycin',           displayName: 'Tobramycin Eye Drops',              category: 'drops',     price: 135, stock: 45,  dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'clotrimazole',         displayName: 'Ear Wax Dissolvent Drops',          category: 'drops',     price: 65,  stock: 85,  dosage: '10 ml',      packQuantity: 10,  packUnit: 'ml' },
  { searchTerm: 'boric acid',           displayName: 'Antiseptic Eye Wash',               category: 'drops',     price: 78,  stock: 60,  dosage: '10 ml',      packQuantity: 10,  packUnit: 'ml' },
  { searchTerm: 'fluocinolone',         displayName: 'Ear Relief Drops',                  category: 'drops',     price: 110, stock: 40,  dosage: '5 ml',       packQuantity: 5,   packUnit: 'ml' },
  { searchTerm: 'hyaluronic acid',      displayName: 'Premium Tear Substitute',           category: 'drops',     price: 420, stock: 20,  dosage: '10 ml',      packQuantity: 10,  packUnit: 'ml' },
  // INJECTIONS (20)
  { searchTerm: 'insulin glargine',     displayName: 'Insulin Glargine',                  category: 'injection', price: 450, stock: 18,  dosage: '10 ml vial', packQuantity: 1,   packUnit: 'vial' },
  { searchTerm: 'ceftriaxone',          displayName: 'Ceftriaxone Injection 1g',          category: 'injection', price: 65,  stock: 45,  dosage: '1 g',        packQuantity: 1,   packUnit: 'vial' },
  { searchTerm: 'diclofenac',           displayName: 'Diclofenac Injection',              category: 'injection', price: 15,  stock: 200, dosage: '3 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'pantoprazole',         displayName: 'Pantoprazole Injection',            category: 'injection', price: 62,  stock: 80,  dosage: '40 mg',      packQuantity: 1,   packUnit: 'vial' },
  { searchTerm: 'cyanocobalamin',       displayName: 'Vit B12 (Methylcobalamin)',         category: 'injection', price: 28,  stock: 150, dosage: '2 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'enoxaparin',           displayName: 'Enoxaparin Prefilled Syringe',      category: 'injection', price: 580, stock: 12,  dosage: '0.6 ml',     packQuantity: 1,   packUnit: 'syringe' },
  { searchTerm: 'clindamycin',          displayName: 'Clindamycin Injection',             category: 'injection', price: 125, stock: 35,  dosage: '600 mg',     packQuantity: 1,   packUnit: 'vial' },
  { searchTerm: 'furosemide',           displayName: 'Furosemide Injection',              category: 'injection', price: 12,  stock: 250, dosage: '2 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'iron sucrose',         displayName: 'Iron Sucrose Injection',            category: 'injection', price: 320, stock: 25,  dosage: '5 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'dexamethasone',        displayName: 'Dexamethasone Injection',           category: 'injection', price: 10,  stock: 300, dosage: '2 ml vial',  packQuantity: 1,   packUnit: 'vial' },
  { searchTerm: 'ondansetron',          displayName: 'Ondansetron Injection',             category: 'injection', price: 18,  stock: 180, dosage: '2 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'gentamicin',           displayName: 'Gentamicin Injection 80mg',         category: 'injection', price: 15,  stock: 220, dosage: '2 ml vial',  packQuantity: 1,   packUnit: 'vial' },
  { searchTerm: 'heparin',              displayName: 'Heparin Sodium Injection',          category: 'injection', price: 245, stock: 30,  dosage: '5000 IU/ml', packQuantity: 5,   packUnit: 'vial' },
  { searchTerm: 'atropine',             displayName: 'Atropine Sulphate',                 category: 'injection', price: 14,  stock: 150, dosage: '1 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'tranexamic acid',      displayName: 'Tranexamic Acid Injection',         category: 'injection', price: 95,  stock: 55,  dosage: '5 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'meropenem',            displayName: 'Meropenem Injection 1g',            category: 'injection', price: 850, stock: 8,   dosage: '1 g',        packQuantity: 1,   packUnit: 'vial' },
  { searchTerm: 'piperacillin',         displayName: 'Piperacillin Tazobactam',           category: 'injection', price: 420, stock: 20,  dosage: '4.5 g',      packQuantity: 1,   packUnit: 'vial' },
  { searchTerm: 'metoclopramide',       displayName: 'Metoclopramide Injection',          category: 'injection', price: 12,  stock: 180, dosage: '2 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'levofloxacin',         displayName: 'Levofloxacin Intravenous',          category: 'injection', price: 185, stock: 30,  dosage: '100 ml IV',  packQuantity: 1,   packUnit: 'bottle' },
  { searchTerm: 'tetanus toxoid',       displayName: 'Tetanus Vaccine',                   category: 'injection', price: 35,  stock: 100, dosage: '0.5 ml',     packQuantity: 1,   packUnit: 'ampoule' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const truncate = (text, max = 220) => {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max - 3).trim() + '...';
};

// ─── OpenFDA ──────────────────────────────────────────────────────────────────
async function fetchOpenFDA(searchTerm) {
  try {
    const encoded = encodeURIComponent(`"${searchTerm}"`);
    const url = `${OPENFDA_BASE}?search=openfda.generic_name:${encoded}&limit=3`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const results = data?.results;
    if (!results?.length) return null;
    // Prefer a result that has a set_id
    const rec = results.find((r) => r.set_id) || results[0];
    return rec;
  } catch {
    return null;
  }
}

// ─── DailyMed ─────────────────────────────────────────────────────────────────
async function fetchDailyMedImage(setId) {
  try {
    const url = `${DAILYMED_BASE}/spls/${setId}/media.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const media = data?.data?.media;
    if (!media?.length) return null;
    // Prefer JPEG images, then any image
    const imgEntry = media.find((m) => m.mime_type?.startsWith('image/jpeg'))
      || media.find((m) => m.mime_type?.startsWith('image/'));
    if (!imgEntry?.url) return null;
    return imgEntry.url;
  } catch {
    return null;
  }
}

// Fallback: search DailyMed by drug name to find a setId with media
async function findDailyMedImageByName(drugName) {
  try {
    const encoded = encodeURIComponent(drugName);
    const url = `${DAILYMED_BASE}/spls.json?drug_name=${encoded}&page_size=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const spls = data?.data;
    if (!spls?.length) return null;

    // Try first few setIds until we get one with an image
    for (const spl of spls.slice(0, 5)) {
      const imgUrl = await fetchDailyMedImage(spl.setid);
      if (imgUrl) return imgUrl;
      await sleep(200);
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Main logic per medicine ───────────────────────────────────────────────────
async function resolveForMedicine(query, index) {
  const result = {
    displayName: query.displayName,
    imageUrl: '',
    imageSource: 'none',
    description: '',
    manufacturer: '',
  };

  // 1. Try OpenFDA for label data
  const fdaRecord = await fetchOpenFDA(query.searchTerm);

  if (fdaRecord) {
    result.description = truncate(
      fdaRecord.indications_and_usage?.[0]
      || fdaRecord.purpose?.[0]
      || fdaRecord.active_ingredient?.[0]
    );
    result.manufacturer = fdaRecord.openfda?.manufacturer_name?.[0] || '';

    // 2a. Try DailyMed via set_id from OpenFDA record
    const setId = fdaRecord.set_id || fdaRecord.openfda?.spl_set_id?.[0];
    if (setId) {
      const dailyMedImg = await fetchDailyMedImage(setId);
      if (dailyMedImg) {
        result.imageUrl = dailyMedImg;
        result.imageSource = 'dailymed-via-openfda';
      }
    }
  }

  // 2b. If still no image, search DailyMed by name
  if (!result.imageUrl) {
    const dailyMedImg = await findDailyMedImageByName(query.searchTerm);
    if (dailyMedImg) {
      result.imageUrl = dailyMedImg;
      result.imageSource = 'dailymed-by-name';
    }
  }

  // 3. Fallback: curated Unsplash image
  if (!result.imageUrl) {
    result.imageUrl = getSeedImageForMedicine({ ...query, name: query.displayName });
    result.imageSource = 'unsplash-fallback';
  }

  if (!result.description) {
    result.description = `Commonly used ${query.searchTerm.replace(/_/g, ' ')} medication. Consult a pharmacist before use.`;
  }

  return result;
}

// ─── Seed Entry Point ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  OpenFDA + DailyMed Medicine Seeder');
  console.log(`  Mode: ${FORCE ? 'FORCE (update all)' : 'INCREMENTAL (missing only)'} ${DRY_RUN ? '| DRY RUN' : ''}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!DRY_RUN) await connectDB();

  const stats = { dailymed: 0, unsplash: 0, noImage: 0, updated: 0, skipped: 0 };

  for (let i = 0; i < MEDICINE_QUERIES.length; i++) {
    const query = MEDICINE_QUERIES[i];
    const num = String(i + 1).padStart(3, ' ');
    process.stdout.write(`[${num}/120] ${query.displayName.padEnd(40)} ... `);

    // Incremental mode: skip medicines that already have a DailyMed image
    if (!FORCE && !DRY_RUN) {
      const existing = await Medicine.findOne({ name: query.displayName }).select('imageUrl').lean();
      if (existing?.imageUrl?.includes('dailymed')) {
        console.log('SKIP (already has DailyMed image)');
        stats.skipped++;
        continue;
      }
    }

    const resolved = await resolveForMedicine(query, i);

    const src = resolved.imageSource === 'dailymed-via-openfda' ? '✅ DailyMed (FDA)'
      : resolved.imageSource === 'dailymed-by-name'             ? '✅ DailyMed (name)'
      : resolved.imageSource === 'unsplash-fallback'            ? '📷 Unsplash'
      :                                                            '❌ None';

    console.log(src);

    if (resolved.imageSource.startsWith('dailymed')) stats.dailymed++;
    else if (resolved.imageSource === 'unsplash-fallback') stats.unsplash++;
    else stats.noImage++;

    if (!DRY_RUN) {
      const updateFields = { imageUrl: resolved.imageUrl };
      if (resolved.description) updateFields.description = resolved.description;
      if (resolved.manufacturer) updateFields.manufacturer = resolved.manufacturer;
      updateFields.sourceName = 'OpenFDA + DailyMed';
      updateFields.sourceUrl = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:%22${encodeURIComponent(query.searchTerm)}%22&limit=1`;

      await Medicine.findOneAndUpdate(
        { name: query.displayName },
        { $set: updateFields },
        { upsert: false }
      );
      stats.updated++;
    }

    // Polite rate limiting: pause between requests, extra pause every 10
    await sleep(DELAY_MS);
    if ((i + 1) % 10 === 0) {
      console.log(`\n  ⏳  Batch pause (${i + 1}/120 done)...\n`);
      await sleep(BATCH_MS);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅  Seeding complete!');
  console.log(`  📸  Real FDA/DailyMed images : ${stats.dailymed}`);
  console.log(`  📷  Unsplash fallback images  : ${stats.unsplash}`);
  console.log(`  ⏭   Skipped (already seeded) : ${stats.skipped}`);
  console.log(`  💾  DB records updated        : ${stats.updated}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Seeder crashed:', err.message);
  process.exit(1);
});
