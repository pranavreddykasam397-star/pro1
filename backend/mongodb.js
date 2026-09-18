const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    id: { type: Number, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: String,
    type: String,
    imageUrl: String,
    isSpecial: { type: Boolean, default: false },
    timeHash: { type: Number, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    id: { type: Number, index: true },
    total: { type: Number, required: true },
    method: { type: String, required: true },
    time: { type: Date, default: Date.now },
    timeHash: Number,
    customer_id: Number,
    phone: String,
    payment_status: { type: String, default: 'PENDING' },
    payment_screenshot: String,
    items: [{
        menu_name: String,
        quantity: Number,
        price_at_time: Number
    }]
});

const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true }
});

const customerSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    pin: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const ownerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true }
});

const dailySummarySchema = new mongoose.Schema({
    id: { type: Number, index: true },
    date: { type: String, required: true, unique: true },
    total_revenue: { type: Number, required: true },
    order_count: { type: Number, required: true },
    orders_json: { type: String, required: true }
});

const Menu = mongoose.model('Menu', menuSchema, 'menus');
const Order = mongoose.model('Order', orderSchema, 'orders');
const Setting = mongoose.model('Setting', settingSchema, 'settings');
const Customer = mongoose.model('Customer', customerSchema, 'customers');
const Owner = mongoose.model('Owner', ownerSchema, 'owners');
const DailySummary = mongoose.model('DailySummary', dailySummarySchema, 'daily_summaries');

async function connectMongoDB() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurantDB';
    if (!process.env.MONGODB_URI) {
        console.log('⚠️ MONGODB_URI environment variable not set. Attempting connection to local MongoDB instance...');
    } else if (process.env.MONGODB_URI.includes('<db_password>')) {
        console.log('⚠️ MONGODB_URI not fully configured yet. Please set real password in .env for MongoDB Atlas.');
        return false;
    }
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB Database successfully!');
        return true;
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        return false;
    }
}

async function seedMongoDB(initialMenu = []) {
    try {
        if (mongoose.connection.readyState !== 1) return;

        // Ensure all 6 collections exist explicitly in MongoDB Atlas
        await Promise.all([
            Menu.createCollection().catch(() => {}),
            Order.createCollection().catch(() => {}),
            Setting.createCollection().catch(() => {}),
            Customer.createCollection().catch(() => {}),
            Owner.createCollection().catch(() => {}),
            DailySummary.createCollection().catch(() => {})
        ]);
        console.log('📁 Ensured all MongoDB collections (customers, daily_summaries, menus, orders, owners, settings) exist.');

        // Seed Menu if empty
        const menuCount = await Menu.countDocuments();
        if (menuCount === 0 && initialMenu.length > 0) {
            console.log('🍃 Seeding MongoDB with initial menu items...');
            const docs = initialMenu.map((item, idx) => ({
                id: item.id || idx + 1,
                name: item.name,
                price: item.price,
                category: item.category,
                type: item.type,
                imageUrl: item.imageUrl,
                isSpecial: item.isSpecial ? true : false,
                timeHash: Date.now()
            }));
            await Menu.insertMany(docs);
            console.log(`🍃 MongoDB seeded with ${docs.length} menu items!`);
        }

        // Seed Config Setting fallback
        const settingExists = await Setting.findOne({ key: 'config' });
        if (!settingExists) {
            await Setting.create({ key: 'config', value: JSON.stringify({ ownerQr: '', upiId: '' }) });
        }

        // Seed Default Owner fallback
        const ownerExists = await Owner.findOne({ email: 'admin@example.com' });
        if (!ownerExists) {
            const defaultHash = process.env.OWNER_HASH || "$2b$10$0DAV3UE6KM9GGdOd0ricMunbm2hmST3w6JcPHJGCUN8DLYXwpG7Tm";
            await Owner.create({ email: 'admin@example.com', password_hash: defaultHash });
        }
    } catch (err) {
        console.error('❌ MongoDB seeding/migration error:', err.message);
    }
}

module.exports = {
    connectMongoDB,
    seedMongoDB,
    Menu,
    Order,
    Setting,
    Customer,
    Owner,
    DailySummary
};
