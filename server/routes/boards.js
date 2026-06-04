const r = require('express').Router();
const c = require('../controllers/boardController');
const auth = require('../middleware/authMiddleware');
r.get('/',     auth, c.getBoards);
r.post('/',    auth, c.createBoard);
r.get('/:id',  auth, c.getBoardDetails);
r.delete('/:id', auth, c.deleteBoard);
module.exports = r;