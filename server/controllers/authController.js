const pool   = require('../db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const axios  = require('axios');

// ─── Helper: generate 6-digit OTP ────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Helper: send OTP email via Brevo ────────────────────
async function sendOTPEmail(toEmail, otp) {
  await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: {
        name:  process.env.SENDER_NAME,
        email: process.env.SENDER_EMAIL
      },
      to: [{ email: toEmail }],
      subject: 'TaskFlow — Your Password Reset OTP',
      htmlContent: `
        <div style="font-family:sans-serif;max-width:460px;margin:auto;
                    padding:32px;border:1px solid #252d42;border-radius:12px;
                    background:#161b27;color:#dce3f5;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
            <div style="width:28px;height:28px;background:#5b8def;border-radius:7px;
                        display:flex;align-items:center;justify-content:center;
                        font-weight:700;color:#fff;font-size:14px;">T</div>
            <span style="font-size:18px;font-weight:600;">TaskFlow</span>
          </div>
          <h2 style="font-size:20px;margin-bottom:8px;">Password Reset OTP</h2>
          <p style="color:#8892b0;margin-bottom:24px;">
            Use the code below to reset your password. It expires in 10 minutes.
          </p>
          <div style="font-size:40px;font-weight:700;letter-spacing:10px;
                      color:#5b8def;text-align:center;padding:20px;
                      background:#1c2235;border-radius:10px;margin-bottom:24px;">
            ${otp}
          </div>
          <p style="color:#4a5470;font-size:12px;">
            If you didn't request this, you can safely ignore this email.
            Never share this OTP with anyone.
          </p>
        </div>
      `
    },
    { headers: { 'api-key': process.env.BREVO_API_KEY } }
  );
}

// ─── Register ─────────────────────────────────────────────
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });
  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email=?', [email]
    );
    if (existing.length)
      return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 12);
    const id   = randomUUID();
    await pool.query(
      'INSERT INTO users (id,name,email,password_hash) VALUES (?,?,?,?)',
      [id, name, email, hash]
    );
    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { id, name, email }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Login ────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Me ───────────────────────────────────────────────────
exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id,name,email,created_at FROM users WHERE id=?', [req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Forgot Password: Send OTP ────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE email=?', [email]
    );
    // Always return success — prevents revealing whether email exists
    if (!rows.length) return res.json({ success: true });

    const otp     = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any old unused OTPs for this email
    await pool.query(
      'UPDATE password_reset_otp SET used=TRUE WHERE email=?', [email]
    );
    // Insert new OTP
    await pool.query(
      'INSERT INTO password_reset_otp (id,email,otp,expires_at) VALUES (UUID(),?,?,?)',
      [email, otp, expires]
    );

    await sendOTPEmail(email, otp);
    res.json({ success: true });
  } catch (err) {
    console.error('forgotPassword error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

// ─── Verify OTP ───────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ error: 'Email and OTP required' });
  try {
    const [rows] = await pool.query(
      `SELECT id FROM password_reset_otp
       WHERE email=? AND otp=? AND used=FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );
    if (!rows.length)
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Reset Password ───────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({ error: 'All fields required' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    // Verify OTP one final time before resetting
    const [rows] = await pool.query(
      `SELECT id FROM password_reset_otp
       WHERE email=? AND otp=? AND used=FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );
    if (!rows.length)
      return res.status(400).json({ error: 'Invalid or expired OTP' });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash=? WHERE email=?', [hash, email]
    );
    // Mark OTP as used so it can't be reused
    await pool.query(
      'UPDATE password_reset_otp SET used=TRUE WHERE email=?', [email]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};