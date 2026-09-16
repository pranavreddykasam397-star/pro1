const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    id: Number,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: String,
    type: String,
    imageUrl: String,
    isSpecial: { type: Boolean, default: false },
    timeHash: { type: Number, default: Date.now }
});

const orderSchema = new mongoose.Schema({
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
    pin: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const ownerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true }
});

const Menu = mongoose.model('Menu', menuSchema);
const Order = mongoose.model('Order', orderSchema);
const Setting = mongoose.model('Setting', settingSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Owner = mongoose.model('Owner', ownerSchema);

async function connectMongoDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('<db_password>')) {
        console.log('⚠️ MONGODB_URI not fully configured yet. Set real password in .env to connect to MongoDB Atlas.');
        return false;
    }
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB Atlas Cloud Database successfully!');
        return true;
    } catch (err) {
        console.error('❌ MongoDB Atlas connection error:', err.message);
        return false;
    }
}

async function seedMongoDB(initialMenu = []) {
    try {
        if (mongoose.connection.readyState !== 1) return;
        
        // Seed Menu
        const menuCount = await Menu.countDocuments();
        if (menuCount === 0 && initialMenu.length > 0) {
            console.log('🍃 Seeding MongoDB Atlas with initial menu items...');
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
            console.log(`🍃 MongoDB Atlas seeded with ${docs.length} menu items!`);
        }

        // Seed Config Setting
        const settingExists = await Setting.findOne({ key: 'config' });
        if (!settingExists) {
            await Setting.create({ key: 'config', value: JSON.stringify({ ownerQr: '', upiId: '' }) });
        }

        // Seed Default Owner
        const ownerExists = await Owner.findOne({ email: 'admin@example.com' });
        if (!ownerExists) {
            const defaultHash = process.env.OWNER_HASH || "$2b$10$0DAV3UE6KM9GGdOd0ricMunbm2hmST3w6JcPHJGCUN8DLYXwpG7Tm";
            await Owner.create({ email: 'admin@example.com', password_hash: defaultHash });
        }
    } catch (err) {
        console.error('❌ MongoDB seeding error:', err.message);
    }
}

module.exports = {
    connectMongoDB,
    seedMongoDB,
    Menu,
    Order,
    Setting,
    Customer,
    Owner
};
