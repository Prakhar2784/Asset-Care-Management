const Article = require('../models/Article');
const { audit } = require('../services/auditService');

// @desc    Get articles (search & filter)
// @route   GET /api/knowledge
// @access  Private
const getArticles = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};

    // Standard scoping: employees only see published articles
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    if (!isAdmin) {
      query.isPublished = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const articles = await Article.find(query)
      .populate('author', 'name email')
      .sort({ views: -1, createdAt: -1 });

    res.status(200).json({ success: true, data: articles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get article by ID (and increment view count)
// @route   GET /api/knowledge/:id
// @access  Private
const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('author', 'name email');
    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    // Standard scoping: non-admins cannot read draft articles
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    if (!isAdmin && !article.isPublished) {
      return res.status(403).json({ message: 'Not authorized to view this draft article.' });
    }

    // Increment view count (bypass Mongoose validation/pre-save hooks for quick updates)
    await Article.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    
    // Increment local views count for response
    article.views += 1;

    res.status(200).json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new article
// @route   POST /api/knowledge
// @access  Private (Admin)
const createArticle = async (req, res) => {
  try {
    const { title, content, category, isPublished } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required.' });
    }

    const article = await Article.create({
      title,
      content,
      category,
      isPublished: isPublished !== undefined ? !!isPublished : true,
      author: req.user._id,
      tenantId: req.tenantId || 'default'
    });

    audit({
      req,
      action: 'article_created',
      entity: 'article',
      entityId: article._id,
      entityLabel: article.title
    });

    res.status(201).json({ success: true, data: article });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update article
// @route   PUT /api/knowledge/:id
// @access  Private (Admin)
const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    const { title, content, category, isPublished } = req.body;

    if (title) article.title = title;
    if (content) article.content = content;
    if (category) article.category = category;
    if (isPublished !== undefined) article.isPublished = !!isPublished;

    const updated = await article.save();

    audit({
      req,
      action: 'article_updated',
      entity: 'article',
      entityId: article._id,
      entityLabel: article.title,
      changes: req.body
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete article
// @route   DELETE /api/knowledge/:id
// @access  Private (Admin)
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    await article.deleteOne();

    audit({
      req,
      action: 'article_deleted',
      entity: 'article',
      entityId: article._id,
      entityLabel: article.title
    });

    res.status(200).json({ success: true, message: 'Article deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
};
