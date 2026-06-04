const r = require('express').Router();
const c = require('../controllers/inviteController');
const auth = require('../middleware/authMiddleware');
r.get('/',            auth, c.getMyInvites);
r.post('/',           auth, c.sendInvite);
r.patch('/:id',       auth, c.respondToInvite);
module.exports = r;