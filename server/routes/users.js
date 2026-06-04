
const r = require('express').Router();
const c = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
r.get('/search',           auth, c.searchUsers);
r.get('/dashboard-stats',  auth, c.getDashboardStats);
r.patch('/profile',        auth, c.updateProfile);
r.patch('/password',       auth, c.changePassword);
r.delete('/account',       auth, c.deleteAccount);
module.exports = r;
