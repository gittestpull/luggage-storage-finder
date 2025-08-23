const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

router.get('/news/entertainment', newsController.getEntertainmentNews);

module.exports = router;
