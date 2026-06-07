const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const c      = require('../controllers/aiController');

router.post('/chat',             auth, c.chat);
router.post('/preview-project',  auth, c.previewProject);   // NEW: returns JSON only, no DB
router.post('/create-project',   auth, c.createProject);    // NEW: saves to DB
router.post('/generate-project', auth, c.generateProject);  // kept for backwards compat

module.exports = router;