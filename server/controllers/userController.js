const pool = require('../db');

exports.searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2)
    return res.status(400).json({ error: 'Query too short' });
  try {
    const [rows] = await pool.query(
      `SELECT id,name,email FROM users
       WHERE (name LIKE ? OR email LIKE ?) AND id != ?
       LIMIT 10`,
      [`%${q}%`, `%${q}%`, req.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // All boards this user owns or is a member of
    const [boards] = await pool.query(
      `SELECT DISTINCT b.id FROM boards b
       LEFT JOIN board_members bm ON bm.board_id=b.id
       WHERE b.owner_id=? OR bm.user_id=?`,
      [req.userId, req.userId]
    );
    const boardIds = boards.map(b => b.id);
    if (!boardIds.length) return res.json({ total:0, completed:0, dueToday:0, overdue:0, recentActivity:[] });

    const placeholders = boardIds.map(()=>'?').join(',');

    const [[total]] = await pool.query(
      `SELECT COUNT(*) AS c FROM tasks t
       JOIN columns c ON c.id=t.column_id
       WHERE c.board_id IN (${placeholders})`, boardIds
    );
    const [[completed]] = await pool.query(
      `SELECT COUNT(*) AS c FROM tasks t
       JOIN columns c ON c.id=t.column_id
       WHERE c.board_id IN (${placeholders}) AND c.title='Done'`, boardIds
    );
    const today = new Date().toISOString().slice(0,10);
    const [[dueToday]] = await pool.query(
      `SELECT COUNT(*) AS c FROM tasks t
       JOIN columns c ON c.id=t.column_id
       WHERE c.board_id IN (${placeholders}) AND DATE(t.due_date)=? AND c.title != 'Done'`,
      [...boardIds, today]
    );
    const [[overdue]] = await pool.query(
      `SELECT COUNT(*) AS c FROM tasks t
       JOIN columns c ON c.id=t.column_id
       WHERE c.board_id IN (${placeholders}) AND t.due_date < NOW() AND c.title != 'Done'`,
      boardIds
    );
    // Recent activity: last 10 tasks created/updated
    const [recentActivity] = await pool.query(
      `SELECT t.id, t.title, t.created_at, b.name AS board_name, c.title AS column_name, u.name AS creator_name
       FROM tasks t
       JOIN columns c ON c.id=t.column_id
       JOIN boards b  ON b.id=c.board_id
       LEFT JOIN users u ON u.id=t.assignee_id
       WHERE c.board_id IN (${placeholders})
       ORDER BY t.created_at DESC LIMIT 10`,
      boardIds
    );

    res.json({
      total: total.c,
      completed: completed.c,
      dueToday: dueToday.c,
      overdue: overdue.c,
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const bcrypt = require('bcryptjs');

exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  if (!name?.trim() || !email?.trim())
    return res.status(400).json({ error: 'Name and email required' });
  try {
    // Check email not taken by another user
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email=? AND id != ?', [email, req.userId]
    );
    if (existing.length)
      return res.status(409).json({ error: 'Email already in use by another account' });

    await pool.query(
      'UPDATE users SET name=?, email=? WHERE id=?',
      [name.trim(), email.trim(), req.userId]
    );
    res.json({ success: true, name: name.trim(), email: email.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both fields required' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id=?', [req.userId]);
    const user   = rows[0];
    const valid  = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=? WHERE id=?', [hash, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=?', [req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};