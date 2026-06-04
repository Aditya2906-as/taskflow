const r = require('express').Router();
const c = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');
r.post('/',      auth, c.createTask);
r.patch('/:id',  auth, c.updateTask);
r.delete('/:id', auth, c.deleteTask);
module.exports = r;