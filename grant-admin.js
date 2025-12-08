const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const TARGET_USERNAME = 'ysk7998@gmail.com';

async function grantAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/luggage-storage-finder');
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username: TARGET_USERNAME });
        if (!user) {
            console.log(`User ${TARGET_USERNAME} not found.`);
            process.exit(1);
        }

        user.isAdmin = true;
        await user.save();
        console.log(`Successfully granted admin privileges to ${TARGET_USERNAME}`);

    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        mongoose.disconnect();
    }
}

grantAdmin();
