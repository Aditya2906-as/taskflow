const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const c      = require('../controllers/authController');

router.post('/register',        c.register);
router.post('/login',           c.login);
router.get ('/me',              auth, c.me);
router.post('/forgot-password', c.forgotPassword);
router.post('/verify-otp',      c.verifyOTP);
router.post('/reset-password',  c.resetPassword);

module.exports = router;