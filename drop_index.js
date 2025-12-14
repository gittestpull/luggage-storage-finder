const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://luggage-storage-finder_old-mongo-1:27017/luggage-storage-finder';

async function dropIndex() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('gamescores');

        // Check if index exists
        const indexes = await collection.indexes();
        const targetIndex = indexes.find(idx => idx.name === 'userId_1_gameId_1');

        if (targetIndex) {
            console.log('Found conflicting index: userId_1_gameId_1');
            await collection.dropIndex('userId_1_gameId_1');
            console.log('Successfully dropped index: userId_1_gameId_1');
        } else {
            console.log('Index userId_1_gameId_1 not found (already dropped?)');
        }

        // List remaining indexes
        const remaining = await collection.indexes();
        console.log('Remaining indexes:', remaining.map(idx => idx.name));

    } catch (error) {
        console.error('Error dropping index:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

dropIndex();
