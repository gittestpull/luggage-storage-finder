const mongoose = require('mongoose');

const newsArticleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true,
        unique: true
    },
    imageUrl: {
        type: String
    },
    publishedAt: {
        type: Date,
        required: true
    },
    source: {
        name: String
    },
    category: {
        type: String,
        enum: ['travel', 'entertainment', 'local'],
        required: true
    },
    location: {
        name: String,
        lat: Number,
        lng: Number
    }
});

const NewsArticle = mongoose.model('NewsArticle', newsArticleSchema);

module.exports = NewsArticle;
