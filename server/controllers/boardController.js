const pool = require('../db');
const { randomUUID } = require('crypto');

exports.getBoards = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT b.*, u.name AS owner_name,
        (SELECT COUNT(*) FROM tasks t JOIN columns c ON c.id=t.column_id WHERE c.board_id=b.id) AS task_count,
        (SELECT COUNT(*) FROM tasks t JOIN columns c ON c.id=t.column_id
          JOIN columns cc ON cc.id=t.column_id WHERE c.board_id=b.id AND cc.title='Done') AS done_count,
        (SELECT COUNT(*) FROM board_members bm2 WHERE bm2.board_id=b.id) + 1 AS member_count
       FROM boards b
       JOIN users u ON u.id = b.owner_id
       LEFT JOIN board_members bm ON bm.board_id = b.id
       WHERE b.owner_id=? OR bm.user_id=?
       ORDER BY b.created_at DESC`,
      [req.userId, req.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createBoard = async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Board name required' });
  try {
    const id = randomUUID();
    await pool.query(
      'INSERT INTO boards (id,name,owner_id) VALUES (?,?,?)',
      [id, name.trim(), req.userId]
    );
    await pool.query(
      `INSERT INTO columns (id,board_id,title,position) VALUES
       (UUID(),?,'To Do',0),(UUID(),?,'In Progress',1),(UUID(),?,'Done',2)`,
      [id, id, id]
    );
    const [rows] = await pool.query(
      `SELECT b.*, u.name AS owner_name, 0 AS task_count, 0 AS done_count, 1 AS member_count
       FROM boards b JOIN users u ON u.id=b.owner_id WHERE b.id=?`,
      [id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBoardDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const [cols]  = await pool.query(
      'SELECT * FROM columns WHERE board_id=? ORDER BY position', [id]
    );
    const [tasks] = await pool.query(
      `SELECT t.*, u.name AS assignee_name FROM tasks t
       LEFT JOIN users u ON u.id=t.assignee_id
       WHERE t.column_id IN (SELECT id FROM columns WHERE board_id=?)
       ORDER BY t.position`,
      [id]
    );
    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email FROM users u
       JOIN board_members bm ON bm.user_id=u.id WHERE bm.board_id=?
       UNION
       SELECT u.id, u.name, u.email FROM users u
       JOIN boards b ON b.owner_id=u.id WHERE b.id=?`,
      [id, id]
    );
    const [board] = await pool.query('SELECT * FROM boards WHERE id=?', [id]);
    res.json({ board: board[0], columns: cols, tasks, members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBoard = async (req, res) => {
  const { id } = req.params;
  try {
    const [b] = await pool.query('SELECT owner_id FROM boards WHERE id=?', [id]);
    if (!b.length) return res.status(404).json({ error: 'Board not found' });
    if (b[0].owner_id !== req.userId)
      return res.status(403).json({ error: 'Only the owner can delete this board' });
    await pool.query('DELETE FROM boards WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};