const r = require('express').Router();
const c = require('../controllers/chatController');
const auth = require('../middleware/authMiddleware');
r.get('/:boardId', auth, c.getMessages);
module.exports = r;