
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getDb, closeDb } from '../lib/db';

async function seedProductData() {
    console.log('Starting product data seeding...');
    const sql = getDb();

    try {
        // 1. Seed Athletic Greens AG1
        console.log('Seeding Athletic Greens AG1...');
        await sql`
      UPDATE products
      SET
        manufacturer = 'Athletic Greens',
        ingredients = 'Vitamin A (as beta-carotene) - 555mcg RAE, Vitamin C (as ascorbic acid) - 420mg, Vitamin E (as d-alpha tocopherol succinate) - 83mg, Vitamin B1 (as thiamine hydrochloride) - 3mg, Vitamin B2 (as riboflavin) - 2mg, Niacin (as nicotinamide) - 20mg NE, Vitamin B6 (as pyridoxine hydrochloride) - 3mg, Folate (as 5-MTHF) - 680mcg DFE, Vitamin B12 (as methylcobalamin) - 22mcg, Biotin - 330mcg, Pantothenic Acid (as calcium pantothenate) - 4mg, Calcium (as calcium carbonate, phosphate, citrate) - 118mg, Phosphorus (as potassium phosphate, calcium phosphate) - 130mg, Magnesium (as glycinate) - 26mg, Zinc (as citrate) - 15mg, Selenium (as selenomethionine) - 20mcg, Copper (as gluconate) - 195mcg, Manganese (as gluconate) - 400mcg, Chromium (as picolinate) - 25mcg, Sodium - 45mg, Potassium (as phosphate, alkaline, carbonate) - 300mg. Proprietary Blends: Raw Superfood Complex (7388mg) - Spirulina, Lecithin, Apple Powder, Inulin, Wheat Grass, Alfalfa, Chlorella, Barley, Broccoli, Papaya, Pineapple, Bilberry, Beet Root, Carrot, Spinach, Grape Seed, Green Tea, Licorice, Lycium Berry, Ginger, Slippery Elm, Kelp. Extracts & Mushrooms (154mg) - Ashwagandha, Rhodiola, Eleuthero, Reishi, Shiitake. Probiotics (38mg) - Lactobacillus acidophilus, Bifidobacterium bifidum.',
        technical_specs = '{"Serving Size": "1 Scoop (12g)", "Servings Per Container": "30", "Calories": "50", "Carbohydrates": "6g", "Fiber": "2g", "Sugar": "<1g", "Protein": "2g"}',
        certifications = ARRAY['NSF Certified for Sport', 'TGA Certified', 'Gluten Free'],
        storage_instructions = 'Refrigerate after opening to maintain probiotic viability. Store in a cool, dry place before opening.',
        serving_size = '1 Scoop (12g)',
        form = 'Powder',
        avg_sme_purity = 9.2,
        avg_sme_bioavailability = 8.5,
        avg_sme_potency = 8.8,
        avg_sme_evidence = 7.5,
        avg_sme_sustainability = 8.0,
        avg_sme_experience = 9.5,
        avg_sme_safety = 9.8,
        avg_sme_transparency = 7.0,
        avg_sme_synergy = 8.9,
        sme_review_count = 5,
        buy_url = 'https://drinkag1.com/',
        ai_summary = 'AG1 by Athletic Greens is a comprehensive daily nutrition supplement combining 75 vitamins, minerals, whole-food source ingredients, probiotics, and adaptogens. It is designed to fill nutritional gaps, support gut health, boost energy, and aid recovery. Our analysis confirms high-quality sourcing and rigorous testing (NSF Certified for Sport), making it a top-tier "all-in-one" solution, though the use of proprietary blends limits transparency on specific dosages of some herbal ingredients.'
      WHERE slug = 'athletic-greens-ag1';
    `;

        // 2. Seed Thorne Magnesium Bisglycinate
        console.log('Seeding Thorne Magnesium Bisglycinate...');
        await sql`
      UPDATE products
      SET
        manufacturer = 'Thorne Research',
        ingredients = 'Magnesium (as Magnesium Bisglycinate Chelate) - 200mg. Other Ingredients: Citric Acid, Monk Fruit concentrate.',
        technical_specs = '{"Serving Size": "1 Scoop (3.83g)", "Servings Per Container": "60", "Magnesium": "200mg"}',
        certifications = ARRAY['NSF Certified for Sport', 'TGA Certified', 'Gluten Free', 'Dairy Free', 'Soy Free'],
        storage_instructions = 'Store tightly sealed in a cool, dry place.',
        serving_size = '1 Scoop (3.83g)',
        form = 'Powder',
        avg_sme_purity = 9.9,
        avg_sme_bioavailability = 9.8,
        avg_sme_potency = 9.5,
        avg_sme_evidence = 9.0,
        avg_sme_sustainability = 8.5,
        avg_sme_experience = 8.0,
        avg_sme_safety = 9.9,
        avg_sme_transparency = 9.5,
        avg_sme_synergy = 9.0,
        sme_review_count = 8,
        buy_url = 'https://www.thorne.com/products/dp/magnesium-bisglycinate',
        ai_summary = 'Thorne Magnesium Bisglycinate is a highly bioavailable magnesium supplement designed to support relaxation, sleep, and muscle recovery. Thorne is renowned for its purity and lack of unnecessary fillers. This product uses a chelated form of magnesium (bisglycinate) which is gentle on the stomach and well-absorbed. Our audit confirms it is NSF Certified for Sport, ensuring it is free from banned substances and contaminants.'
      WHERE slug = 'thorne-magnesium-bisglycinate';
    `;

        console.log('Product data seeding complete.');

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await closeDb();
        process.exit(0);
    }
}

seedProductData();
