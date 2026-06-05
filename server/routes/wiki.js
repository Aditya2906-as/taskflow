const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const c      = require('../controllers/wikiController');

router.get   ('/:boardId/pages', auth, c.getPages);
router.post  ('/:boardId/pages', auth, c.createPage);
router.put   ('/pages/:id',      auth, c.updatePage);
router.delete('/pages/:id',      auth, c.deletePage);

module.exports = router;