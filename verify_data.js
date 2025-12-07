const mongoose = require('mongoose');
const Storage = require('./src/models/Storage');
require('dotenv').config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/luggage-storage-finder');
        const count = await Storage.countDocuments();
        console.log(`Total storage records: ${count}`);
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
verify();
