const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
} = require('../controllers/knowledgeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getArticles)
  .post(protect, authorize('admin'), createArticle);

router.route('/:id')
  .get(protect, getArticleById)
  .put(protect, authorize('admin'), updateArticle)
  .delete(protect, authorize('admin'), deleteArticle);

module.exports = router;
