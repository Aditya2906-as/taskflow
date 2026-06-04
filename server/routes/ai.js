const r    = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c    = require('../controllers/aiController');
r.post('/chat', auth, c.chat);
module.exports = r;