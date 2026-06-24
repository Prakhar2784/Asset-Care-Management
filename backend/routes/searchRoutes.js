const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, globalSearch);

module.exports = router;
