const MEDICINE_QUERIES = [
  // ──────────────────────────────────────────────────────────────────────────
  // TABLETS (20)
  // ──────────────────────────────────────────────────────────────────────────
  { searchTerm: 'acetaminophen', displayName: 'Paracetamol / Acetaminophen 500mg', category: 'tablet', price: 25, stock: 100, dosage: '500 mg', packQuantity: 10, packUnit: 'tablets' },
  { searchTerm: 'ibuprofen', displayName: 'Ibuprofen 400mg', category: 'tablet', price: 32, stock: 75, dosage: '400 mg', packQuantity: 10, packUnit: 'tablets' },
  { searchTerm: 'cetirizine', displayName: 'Cetirizine 10mg', category: 'tablet', price: 22, stock: 120, dosage: '10 mg', packQuantity: 10, packUnit: 'tablets' },
  { searchTerm: 'metformin', displayName: 'Metformin 500mg', category: 'tablet', price: 30, stock: 90, dosage: '500 mg', packQuantity: 15, packUnit: 'tablets' },
  { searchTerm: 'amlodipine', displayName: 'Amlodipine 5mg', category: 'tablet', price: 40, stock: 90, dosage: '5 mg', packQuantity: 10, packUnit: 'tablets' },
  { searchTerm: 'lisinopril', displayName: 'Lisinopril 10mg', category: 'tablet', price: 45, stock: 80, dosage: '10 mg', packQuantity: 28, packUnit: 'tablets' },
  { searchTerm: 'atorvastatin', displayName: 'Atorvastatin 20mg', category: 'tablet', price: 55, stock: 65, dosage: '20 mg', packQuantity: 30, packUnit: 'tablets' },
  { searchTerm: 'levothyroxine', displayName: 'Levothyroxine 100mcg', category: 'tablet', price: 38, stock: 110, dosage: '100 mcg', packQuantity: 30, packUnit: 'tablets' },
  { searchTerm: 'losartan', displayName: 'Losartan 50mg', category: 'tablet', price: 42, stock: 70, dosage: '50 mg', packQuantity: 30, packUnit: 'tablets' },
  { searchTerm: 'albuterol', displayName: 'Albuterol Tablet 4mg', category: 'tablet', price: 28, stock: 50, dosage: '4 mg', packQuantity: 10, packUnit: 'tablets' },
  { searchTerm: 'prednisone', displayName: 'Prednisone 5mg', category: 'tablet', price: 15, stock: 150, dosage: '5 mg', packQuantity: 10, packUnit: 'tablets' },
  { searchTerm: 'gabapentin', displayName: 'Gabapentin 300mg', category: 'tablet', price: 60, stock: 40, dosage: '300 mg', packQuantity: 30, packUnit: 'tablets' },
  { searchTerm: 'amoxicillin', displayName: 'Amoxicillin Tablet 500mg', category: 'tablet', price: 35, stock: 100, dosage: '500 mg', packQuantity: 20, packUnit: 'tablets' },
  { searchTerm: 'sertraline', displayName: 'Sertraline 50mg', category: 'tablet', price: 50, stock: 55, dosage: '50 mg', packQuantity: 30, packUnit: 'tablets' },
  { searchTerm: 'montelukast', displayName: 'Montelukast 10mg', category: 'tablet', price: 33, stock: 85, dosage: '10 mg', packQuantity: 30, packUnit: 'tablets' },
  { searchTerm: 'meloxicam', displayName: 'Meloxicam 15mg', category: 'tablet', price: 24, stock: 95, dosage: '15 mg', packQuantity: 10, packUnit: 'tablets' },
  { searchTerm: 'pantoprazole', displayName: 'Pantoprazole 40mg', category: 'tablet', price: 39, stock: 75, dosage: '40 mg', packQuantity: 30, packUnit: 'tablets' },
  { searchTerm: 'furosemide', displayName: 'Furosemide 40mg', category: 'tablet', price: 18, stock: 130, dosage: '40 mg', packQuantity: 20, packUnit: 'tablets' },
  { searchTerm: 'clopidogrel', displayName: 'Clopidogrel 75mg', category: 'tablet', price: 48, stock: 60, dosage: '75 mg', packQuantity: 28, packUnit: 'tablets' },
  { searchTerm: 'tamsulosin', displayName: 'Tamsulosin 0.4mg', category: 'tablet', price: 52, stock: 45, dosage: '0.4 mg', packQuantity: 30, packUnit: 'tablets' },

  // ──────────────────────────────────────────────────────────────────────────
  // CAPSULES (20)
  // ──────────────────────────────────────────────────────────────────────────
  { searchTerm: 'omeprazole', displayName: 'Omeprazole 20mg', category: 'capsule', price: 48, stock: 60, dosage: '20 mg', packQuantity: 15, packUnit: 'capsules' },
  { searchTerm: 'amoxicillin', displayName: 'Amoxicillin 500mg', category: 'capsule', price: 65, stock: 45, dosage: '500 mg', packQuantity: 15, packUnit: 'capsules' },
  { searchTerm: 'fluoxetine', displayName: 'Fluoxetine 20mg', category: 'capsule', price: 35, stock: 80, dosage: '20 mg', packQuantity: 30, packUnit: 'capsules' },
  { searchTerm: 'duloxetine', displayName: 'Duloxetine 30mg', category: 'capsule', price: 58, stock: 40, dosage: '30 mg', packQuantity: 30, packUnit: 'capsules' },
  { searchTerm: 'venlafaxine', displayName: 'Venlafaxine 75mg', category: 'capsule', price: 62, stock: 35, dosage: '75 mg', packQuantity: 30, packUnit: 'capsules' },
  { searchTerm: 'celecoxib', displayName: 'Celecoxib 200mg', category: 'capsule', price: 75, stock: 25, dosage: '200 mg', packQuantity: 10, packUnit: 'capsules' },
  { searchTerm: 'doxycycline', displayName: 'Doxycycline 100mg', category: 'capsule', price: 45, stock: 60, dosage: '100 mg', packQuantity: 10, packUnit: 'capsules' },
  { searchTerm: 'clindamycin', displayName: 'Clindamycin 300mg', category: 'capsule', price: 82, stock: 20, dosage: '300 mg', packQuantity: 15, packUnit: 'capsules' },
  { searchTerm: 'gabapentin', displayName: 'Gabapentin Capsule 300mg', category: 'capsule', price: 55, stock: 50, dosage: '300 mg', packQuantity: 30, packUnit: 'capsules' },
  { searchTerm: 'tamsulosin', displayName: 'Tamsulosin Capsule 0.4mg', category: 'capsule', price: 58, stock: 45, dosage: '0.4 mg', packQuantity: 30, packUnit: 'capsules' },
  { searchTerm: 'nitrofurantoin', displayName: 'Nitrofurantoin 100mg', category: 'capsule', price: 68, stock: 30, dosage: '100 mg', packQuantity: 14, packUnit: 'capsules' },
  { searchTerm: 'minocycline', displayName: 'Minocycline 50mg', category: 'capsule', price: 92, stock: 15, dosage: '50 mg', packQuantity: 30, packUnit: 'capsules' },
  { searchTerm: 'pregabalin', displayName: 'Pregabalin 75mg', category: 'capsule', price: 72, stock: 40, dosage: '75 mg', packQuantity: 14, packUnit: 'capsules' },
  { searchTerm: 'atomoxetine', displayName: 'Atomoxetine 40mg', category: 'capsule', price: 110, stock: 10, dosage: '40 mg', packQuantity: 30, packUnit: 'capsules' },
  { searchTerm: 'fluconazole', displayName: 'Fluconazole 150mg', category: 'capsule', price: 45, stock: 90, dosage: '150 mg', packQuantity: 1, packUnit: 'capsule' },
  { searchTerm: 'lansoprazole', displayName: 'Lansoprazole 30mg', category: 'capsule', price: 52, stock: 55, dosage: '30 mg', packQuantity: 30, packUnit: 'capsules' },
  { searchTerm: 'cephalexin', displayName: 'Cephalexin 500mg', category: 'capsule', price: 38, stock: 70, dosage: '500 mg', packQuantity: 20, packUnit: 'capsules' },
  { searchTerm: 'azithromycin', displayName: 'Azithromycin Capsule 250mg', category: 'capsule', price: 95, stock: 25, dosage: '250 mg', packQuantity: 6, packUnit: 'capsules' },
  { searchTerm: 'itraconazole', displayName: 'Itraconazole 100mg', category: 'capsule', price: 125, stock: 15, dosage: '100 mg', packQuantity: 10, packUnit: 'capsules' },
  { searchTerm: 'vitamin_d3', displayName: 'Vitamin D3 60K', category: 'capsule', price: 30, stock: 200, dosage: '60000 IU', packQuantity: 4, packUnit: 'capsules' },

  // ──────────────────────────────────────────────────────────────────────────
  // SYRUPS (20)
  // ──────────────────────────────────────────────────────────────────────────
  { searchTerm: 'dextromethorphan', displayName: 'Cough Relief Syrup', category: 'syrup', price: 95, stock: 35, dosage: '100 ml', packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'paracetamol', displayName: 'Paracetamol Pediatric Syrup', category: 'syrup', price: 45, stock: 120, dosage: '60 ml', packQuantity: 60, packUnit: 'ml' },
  { searchTerm: 'ambroxol', displayName: 'Ambroxol Syrup 30mg/5ml', category: 'syrup', price: 78, stock: 50, dosage: '100 ml', packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'salbutamol', displayName: 'Salbutamol Syrup', category: 'syrup', price: 35, stock: 80, dosage: '100 ml', packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'levocetirizine', displayName: 'Levocetirizine Syrup', category: 'syrup', price: 62, stock: 65, dosage: '60 ml', packQuantity: 60, packUnit: 'ml' },
  { searchTerm: 'sucralfate', displayName: 'Sucralfate Suspension', category: 'syrup', price: 120, stock: 25, dosage: '200 ml', packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'multivitamin', displayName: 'Multivitamin Health Tonic', category: 'syrup', price: 150, stock: 40, dosage: '225 ml', packQuantity: 225, packUnit: 'ml' },
  { searchTerm: 'magnesium_hydroxide', displayName: 'Milk of Magnesia', category: 'syrup', price: 85, stock: 60, dosage: '170 ml', packQuantity: 170, packUnit: 'ml' },
  { searchTerm: 'ficus_religiosa', displayName: 'Ayurvedic Cough Syrup', category: 'syrup', price: 110, stock: 45, dosage: '100 ml', packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'ferrous_ascorbate', displayName: 'Iron & Folic Acid Syrup', category: 'syrup', price: 175, stock: 30, dosage: '200 ml', packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'calcium_gluconate', displayName: 'Calcium Syrup with Vit D3', category: 'syrup', price: 135, stock: 55, dosage: '200 ml', packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'disodium_hydrogen_citrate', displayName: 'Alkalizer Syrup', category: 'syrup', price: 92, stock: 70, dosage: '100 ml', packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'cyproheptadine', displayName: 'Appetite Stimulant Syrup', category: 'syrup', price: 105, stock: 40, dosage: '200 ml', packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'lactulose', displayName: 'Lactulose Oral Solution', category: 'syrup', price: 210, stock: 20, dosage: '200 ml', packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'ondansetron', displayName: 'Ondansetron Drops', category: 'syrup', price: 48, stock: 100, dosage: '30 ml', packQuantity: 30, packUnit: 'ml' },
  { searchTerm: 'domperidone', displayName: 'Domperidone Suspension', category: 'syrup', price: 55, stock: 85, dosage: '30 ml', packQuantity: 30, packUnit: 'ml' },
  { searchTerm: 'albendazole', displayName: 'Albendazole Oral Suspension', category: 'syrup', price: 28, stock: 150, dosage: '10 ml', packQuantity: 10, packUnit: 'ml' },
  { searchTerm: 'metronidazole', displayName: 'Metronidazole Suspension', category: 'syrup', price: 42, stock: 95, dosage: '60 ml', packQuantity: 60, packUnit: 'ml' },
  { searchTerm: 'b-complex', displayName: 'B-Complex Syrup', category: 'syrup', price: 88, stock: 110, dosage: '200 ml', packQuantity: 200, packUnit: 'ml' },
  { searchTerm: 'antacid', displayName: 'Mint Antacid Liquid', category: 'syrup', price: 75, stock: 130, dosage: '170 ml', packQuantity: 170, packUnit: 'ml' },

  // ──────────────────────────────────────────────────────────────────────────
  // CREAMS (20)
  // ──────────────────────────────────────────────────────────────────────────
  { searchTerm: 'clotrimazole', displayName: 'Clotrimazole Cream', category: 'cream', price: 68, stock: 40, dosage: '1% w/w', packQuantity: 30, packUnit: 'g' },
  { searchTerm: 'diclofenac', displayName: 'Pain Relief Gel', category: 'cream', price: 85, stock: 55, dosage: '30 g', packQuantity: 30, packUnit: 'g' },
  { searchTerm: 'hydrocortisone', displayName: 'Hydrocortisone Cream 1%', category: 'cream', price: 42, stock: 100, dosage: '15 g', packQuantity: 15, packUnit: 'g' },
  { searchTerm: 'mupirocin', displayName: 'Mupirocin Ointment', category: 'cream', price: 145, stock: 25, dosage: '5 g', packQuantity: 5, packUnit: 'g' },
  { searchTerm: 'ketoconazole', displayName: 'Ketoconazole Cream 2%', category: 'cream', price: 115, stock: 35, dosage: '30 g', packQuantity: 30, packUnit: 'g' },
  { searchTerm: 'adapalene', displayName: 'Adapalene Gel 0.1%', category: 'cream', price: 210, stock: 20, dosage: '15 g', packQuantity: 15, packUnit: 'g' },
  { searchTerm: 'benzoyl_peroxide', displayName: 'Benzoyl Peroxide Gel 5%', category: 'cream', price: 125, stock: 45, dosage: '20 g', packQuantity: 20, packUnit: 'g' },
  { searchTerm: 'betamethasone', displayName: 'Betamethasone Skin Cream', category: 'cream', price: 38, stock: 90, dosage: '20 g', packQuantity: 20, packUnit: 'g' },
  { searchTerm: 'fusidic_acid', displayName: 'Fusidic Acid Cream', category: 'cream', price: 155, stock: 30, dosage: '10 g', packQuantity: 10, packUnit: 'g' },
  { searchTerm: 'terbinafine', displayName: 'Terbinafine Cream 1%', category: 'cream', price: 135, stock: 40, dosage: '10 g', packQuantity: 10, packUnit: 'g' },
  { searchTerm: 'permethrin', displayName: 'Permethrin Cream 5%', category: 'cream', price: 95, stock: 60, dosage: '30 g', packQuantity: 30, packUnit: 'g' },
  { searchTerm: 'silver_sulfadiazine', displayName: 'Silver Sulfadiazine Burn Cream', category: 'cream', price: 110, stock: 50, dosage: '25 g', packQuantity: 25, packUnit: 'g' },
  { searchTerm: 'miconazole', displayName: 'Miconazole Nitrate Cream', category: 'cream', price: 72, stock: 75, dosage: '15 g', packQuantity: 15, packUnit: 'g' },
  { searchTerm: 'tretinoin', displayName: 'Tretinoin Cream 0.025%', category: 'cream', price: 185, stock: 25, dosage: '20 g', packQuantity: 20, packUnit: 'g' },
  { searchTerm: 'beclomethasone', displayName: 'Beclomethasone Dipropionate', category: 'cream', price: 45, stock: 110, dosage: '15 g', packQuantity: 15, packUnit: 'g' },
  { searchTerm: 'clobetasol', displayName: 'Clobetasol Propionate Ointment', category: 'cream', price: 58, stock: 95, dosage: '30 g', packQuantity: 30, packUnit: 'g' },
  { searchTerm: 'povidone-iodine', displayName: 'Antiseptic Ointment', category: 'cream', price: 65, stock: 120, dosage: '15 g', packQuantity: 15, packUnit: 'g' },
  { searchTerm: 'heparin', displayName: 'Thrombophob Gel', category: 'cream', price: 142, stock: 30, dosage: '20 g', packQuantity: 20, packUnit: 'g' },
  { searchTerm: 'calamine', displayName: 'Calamine Lotion', category: 'cream', price: 88, stock: 85, dosage: '100 ml', packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'aloevera', displayName: 'Soothing Aloe Vera Gel', category: 'cream', price: 120, stock: 70, dosage: '150 g', packQuantity: 150, packUnit: 'g' },

  // ──────────────────────────────────────────────────────────────────────────
  // DROPS (20)
  // ──────────────────────────────────────────────────────────────────────────
  { searchTerm: 'carboxymethylcellulose', displayName: 'Lubricating Eye Drops', category: 'drops', price: 145, stock: 50, dosage: '10 ml', packQuantity: 10, packUnit: 'ml' },
  { searchTerm: 'timolol', displayName: 'Timolol Eye Drops 0.5%', category: 'drops', price: 92, stock: 40, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'ciprofloxacin', displayName: 'Cipro Ear/Eye Drops', category: 'drops', price: 35, stock: 150, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'naphazoline', displayName: 'Naphazoline Eye Drops', category: 'drops', price: 48, stock: 120, dosage: '10 ml', packQuantity: 10, packUnit: 'ml' },
  { searchTerm: 'brimonidine', displayName: 'Brimonidine Eye Drops 0.2%', category: 'drops', price: 210, stock: 25, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'loteprednol', displayName: 'Loteprednol Eye Drops', category: 'drops', price: 345, stock: 15, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'moxifloxacin', displayName: 'Moxifloxacin Eye Drops', category: 'drops', price: 125, stock: 65, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'xylometazoline', displayName: 'Nasal Decongestant Drops', category: 'drops', price: 55, stock: 95, dosage: '10 ml', packQuantity: 10, packUnit: 'ml' },
  { searchTerm: 'saline', displayName: 'Saline Nasal Drops', category: 'drops', price: 28, stock: 200, dosage: '15 ml', packQuantity: 15, packUnit: 'ml' },
  { searchTerm: 'ofloxacin', displayName: 'Ofloxacin Ear Drops', category: 'drops', price: 42, stock: 110, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'prednisolone', displayName: 'Prednisolone Eye Drops', category: 'drops', price: 85, stock: 55, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'gentamicin', displayName: 'Gentamicin Eye/Ear Drops', category: 'drops', price: 22, stock: 180, dosage: '10 ml', packQuantity: 10, packUnit: 'ml' },
  { searchTerm: 'flurbiprofen', displayName: 'Flurbiprofen Eye Drops', category: 'drops', price: 115, stock: 35, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'olopatadine', displayName: 'Olopatadine Eye Drops', category: 'drops', price: 195, stock: 30, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'dorzolamide', displayName: 'Dorzolamide Eye Drops', category: 'drops', price: 255, stock: 20, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'tobramycin', displayName: 'Tobramycin Eye Drops', category: 'drops', price: 135, stock: 45, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'clotrimazole_ear', displayName: 'Ear Wax Dissolvent Drops', category: 'drops', price: 65, stock: 85, dosage: '10 ml', packQuantity: 10, packUnit: 'ml' },
  { searchTerm: 'boric_acid', displayName: 'Antiseptic Eye Wash', category: 'drops', price: 78, stock: 60, dosage: '10 ml', packQuantity: 10, packUnit: 'ml' },
  { searchTerm: 'fluocinolone', displayName: 'Ear Relief Drops', category: 'drops', price: 110, stock: 40, dosage: '5 ml', packQuantity: 5, packUnit: 'ml' },
  { searchTerm: 'hyaluronic_acid', displayName: 'Premium Tear Substitute', category: 'drops', price: 420, stock: 20, dosage: '10 ml', packQuantity: 10, packUnit: 'ml' },

  // ──────────────────────────────────────────────────────────────────────────
  // INJECTIONS (20)
  // ──────────────────────────────────────────────────────────────────────────
  { searchTerm: 'insulin', displayName: 'Insulin Glargine', category: 'injection', price: 450, stock: 18, dosage: '10 ml vial', packQuantity: 1, packUnit: 'vial' },
  { searchTerm: 'ceftriaxone', displayName: 'Ceftriaxone Injection 1g', category: 'injection', price: 65, stock: 45, dosage: '1 g', packQuantity: 1, packUnit: 'vial' },
  { searchTerm: 'diclofenac_injection', displayName: 'Diclofenac Injection', category: 'injection', price: 15, stock: 200, dosage: '3 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'pantoprazole_intravenous', displayName: 'Pantoprazole Injection', category: 'injection', price: 62, stock: 80, dosage: '40 mg', packQuantity: 1, packUnit: 'vial' },
  { searchTerm: 'vitamin_b12', displayName: 'Vit B12 (Methylcobalamin)', category: 'injection', price: 28, stock: 150, dosage: '2 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'enoxaparin', displayName: 'Enoxaparin Prefilled Syringe', category: 'injection', price: 580, stock: 12, dosage: '0.6 ml', packQuantity: 1, packUnit: 'syringe' },
  { searchTerm: 'clindamycin_injection', displayName: 'Clindamycin Injection', category: 'injection', price: 125, stock: 35, dosage: '600 mg', packQuantity: 1, packUnit: 'vial' },
  { searchTerm: 'furosemide_injection', displayName: 'Furosemide Injection', category: 'injection', price: 12, stock: 250, dosage: '2 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'iron_sucrose', displayName: 'Iron Sucrose Injection', category: 'injection', price: 320, stock: 25, dosage: '5 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'dexamethasone', displayName: 'Dexamethasone Injection', category: 'injection', price: 10, stock: 300, dosage: '2 ml vial', packQuantity: 1, packUnit: 'vial' },
  { searchTerm: 'ondansetron_injection', displayName: 'Ondansetron Injection', category: 'injection', price: 18, stock: 180, dosage: '2 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'gentamicin_injection', displayName: 'Gentamicin Injection 80mg', category: 'injection', price: 15, stock: 220, dosage: '2 ml vial', packQuantity: 1, packUnit: 'vial' },
  { searchTerm: 'heparin_sodium', displayName: 'Heparin Sodium Injection', category: 'injection', price: 245, stock: 30, dosage: '5000 IU/ml', packQuantity: 5, packUnit: 'vial' },
  { searchTerm: 'atropine', displayName: 'Atropine Sulphate', category: 'injection', price: 14, stock: 150, dosage: '1 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'tranexamic_acid', displayName: 'Tranexamic Acid Injection', category: 'injection', price: 95, stock: 55, dosage: '5 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'meropenem', displayName: 'Meropenem Injection 1g', category: 'injection', price: 850, stock: 8, dosage: '1 g', packQuantity: 1, packUnit: 'vial' },
  { searchTerm: 'piperacillin', displayName: 'Piperacillin Tazobactam', category: 'injection', price: 420, stock: 20, dosage: '4.5 g', packQuantity: 1, packUnit: 'vial' },
  { searchTerm: 'metoclopramide', displayName: 'Metoclopramide Injection', category: 'injection', price: 12, stock: 180, dosage: '2 ml ampoule', packQuantity: 1, packUnit: 'ampoule' },
  { searchTerm: 'levofloxacin_injection', displayName: 'Levofloxacin Intravenous', category: 'injection', price: 185, stock: 30, dosage: '100 ml IV', packQuantity: 1, packUnit: 'bottle' },
  { searchTerm: 'tetanus_toxoid', displayName: 'Tetanus Vaccine', category: 'injection', price: 35, stock: 100, dosage: '0.5 ml', packQuantity: 1, packUnit: 'ampoule' },
];

const IMAGE_MAPPER = {
  tablet: [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576073719710-0a1b51853db5?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1471864190281-ad5f9fb072b2?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1628243344933-2882a7f5aeb4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584017947474-1770d38f0e5e?q=80&w=800&auto=format&fit=crop'
  ],
  capsule: [
    'https://images.unsplash.com/photo-1550572017-0bed8c807fb5?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1626082854244-031c172ac7d6?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?q=80&w=800&auto=format&fit=crop'
  ],
  syrup: [
    'https://images.unsplash.com/photo-1628771065518-0d82f593ed33?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584017947474-1770d38f0e5e?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1471864190281-ad5f9fb072b2?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop'
  ],
  cream: [
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618331835717-801697867623?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584308914594-1f149527e597?q=80&w=800&auto=format&fit=crop'
  ],
  drops: [
    'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584362946551-7890f507b941?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584017947474-1770d38f0e5e?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1628243344933-2882a7f5aeb4?q=80&w=800&auto=format&fit=crop'
  ],
  injection: [
    'https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583912267550-d44d7a12982c?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579154235602-3c2c2992d216?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop'
  ],
  other: [
    'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576091160550-2173599ab14c?q=80&w=800&auto=format&fit=crop'
  ],
};

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const truncateText = (value, maxLength = 180) => {
  const cleanValue = normalizeText(value);
  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }
  return `${cleanValue.slice(0, maxLength - 3).trim()}...`;
};

const buildDescription = (record, fallbackName) => {
  const descriptionSource =
    record.indications_and_usage?.[0] ||
    record.purpose?.[0] ||
    record.active_ingredient?.[0] ||
    `General use information for ${fallbackName}`;
  return truncateText(descriptionSource);
};

const buildSourceUrl = (searchTerm) =>
  `https://api.fda.gov/drug/label.json?search=openfda.generic_name:%22${encodeURIComponent(searchTerm)}%22&limit=1`;

const mapFdaRecordToMedicine = (query, record) => ({
  name: query.displayName,
  price: query.price,
  description: buildDescription(record, query.displayName),
  manufacturer: normalizeText(record.openfda?.manufacturer_name?.[0]),
  sourceName: 'openFDA + Stock Image',
  sourceUrl: buildSourceUrl(query.searchTerm),
  imageUrl: '',
  dosage: query.dosage || '',
  packQuantity: query.packQuantity ?? null,
  packUnit: query.packUnit || '',
  category: query.category,
  stock: query.stock,
});

const buildFallbackMedicine = (query) => ({
  name: query.displayName,
  price: query.price,
  description: `Commonly used for ${query.searchTerm.replace(/_/g, ' ')} care. Consult a doctor or pharmacist before use.`,
  manufacturer: '',
  sourceName: 'openFDA (fallback) + Stock Image',
  sourceUrl: buildSourceUrl(query.searchTerm),
  imageUrl: '',
  dosage: query.dosage || '',
  packQuantity: query.packQuantity ?? null,
  packUnit: query.packUnit || '',
  category: query.category,
  stock: query.stock,
});

const fetchFdaRecord = async (query) => {
  try {
    const response = await fetch(buildSourceUrl(query.searchTerm));
    const data = await response.json();
    if (!response.ok || !data.results?.length) {
      return null;
    }
    return data.results[0];
  } catch {
    return null;
  }
};

const getSeedMedicines = async () => {
  const categoryCounts = {};
  
  // We'll process in batches to avoid overwhelming the API
  const BATCH_SIZE = 10;
  const results = [];
  
  for (let i = 0; i < MEDICINE_QUERIES.length; i += BATCH_SIZE) {
    const batch = MEDICINE_QUERIES.slice(i, i + BATCH_SIZE);
    console.log(`Seeding medicines batch ${i / BATCH_SIZE + 1}...`);
    
    const batchResults = await Promise.all(
      batch.map(async (query) => {
        // Track count per category for round-robin images
        const count = categoryCounts[query.category] || 0;
        categoryCounts[query.category] = count + 1;
        
        const images = IMAGE_MAPPER[query.category] || IMAGE_MAPPER.other;
        const imageUrl = images[count % images.length];
        
        const fdaRecord = await fetchFdaRecord(query);
        let medicine;
        
        if (fdaRecord) {
          medicine = mapFdaRecordToMedicine(query, fdaRecord);
        } else {
          medicine = buildFallbackMedicine(query);
        }
        
        medicine.imageUrl = imageUrl;
        return medicine;
      })
    );
    
    results.push(...batchResults);
    // Add a tiny delay between batches
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
};

module.exports = {
  getSeedMedicines,
};
