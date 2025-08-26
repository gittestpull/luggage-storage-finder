const express = require('express');
const router = express.Router();
const NewsArticle = require('../models/NewsArticle');

// Get all news articles
router.get('/', async (req, res) => {
    try {
        const articles = await NewsArticle.find().sort({ publishedAt: -1 });
        res.json(articles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;