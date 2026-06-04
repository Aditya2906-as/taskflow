const r = require('express').Router();
const c = require('../controllers/notificationController');
const auth = require('../middleware/authMiddleware');
r.get('/',           auth, c.getNotifications);
r.get('/unread',     auth, c.getUnreadCount);
r.patch('/:id/read', auth, c.markRead);
r.patch('/read-all', auth, c.markAllRead);
module.exports = r;