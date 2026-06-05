const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const c      = require('../controllers/aiController');

router.post('/chat',             auth, c.chat);
router.post('/generate-project', auth, c.generateProject);

module.exports = router;