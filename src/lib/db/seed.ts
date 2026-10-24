import { db } from './index';
import { menuItems, settings } from './schema';
import * as fs from 'fs';
import * as path from 'path';

async function seed() {
  console.log('🌱 Starting Heritage Restaurant Database Seeding...');

  try {
    const jsonPath = path.join(__dirname, 'menuData.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`menuData.json not found at ${jsonPath}`);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const items = JSON.parse(rawData);

    console.log(`📖 Found ${items.length} dishes in menuData.json. Inserting into PostgreSQL...`);

    // Format items to match schema
    const formattedItems = items.map((item: any, idx: number) => ({
      name: item.name,
      price: Number(item.price) || 0,
      category: item.category || 'GENERAL',
      type: (item.type || 'veg').toLowerCase(),
      imageUrl: item.imageUrl || null,
      isSpecial: Boolean(item.isSpecial),
      timeHash: String(item.timeHash || Date.now()),
    }));

    // Batch insert in chunks of 50 to avoid parameter limit issues
    const chunkSize = 50;
    for (let i = 0; i < formattedItems.length; i += chunkSize) {
      const chunk = formattedItems.slice(i, i + chunkSize);
      await db.insert(menuItems).values(chunk);
    }

    console.log(`✅ Successfully seeded ${formattedItems.length} menu items.`);

    // Initialize default restaurant settings if not present
    console.log('⚙️ Initializing default restaurant settings...');
    await db
      .insert(settings)
      .values({
        key: 'config',
        value: {
          upiId: '9392767835@ybl',
          ownerQr: '',
        },
      })
      .onConflictDoNothing();

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

seed();
