const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const app = require('../backend/server.js');
const { connectMongoDB } = require('../backend/mongodb.js');

let isConnected = false;

module.exports = async (req, res) => {
    if (!isConnected) {
        isConnected = await connectMongoDB();
    }
    return app(req, res);
};
