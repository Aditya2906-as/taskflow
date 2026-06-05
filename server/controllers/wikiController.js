const pool = require('../db');
const { randomUUID } = require('crypto');

// GET all pages for a board
exports.getPages = async (req, res) => {
  const { boardId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT wp.*, u.name AS author_name
       FROM wiki_pages wp
       LEFT JOIN users u ON u.id = wp.created_by
       WHERE wp.board_id = ?
       ORDER BY wp.category, wp.created_at DESC`,
      [boardId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST create a new page
exports.createPage = async (req, res) => {
  const { boardId } = req.params;
  const { title, content, category } = req.body;
  try {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO wiki_pages (id, board_id, title, content, category, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, boardId, title || 'Untitled', content || '', category || 'notes', req.userId]
    );
    const [[page]] = await pool.query(
      `SELECT wp.*, u.name AS author_name
       FROM wiki_pages wp
       LEFT JOIN users u ON u.id = wp.created_by
       WHERE wp.id = ?`,
      [id]
    );
    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update a page
exports.updatePage = async (req, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;
  try {
    await pool.query(
      `UPDATE wiki_pages SET
         title    = COALESCE(?, title),
         content  = COALESCE(?, content),
         category = COALESCE(?, category)
       WHERE id = ?`,
      [title ?? null, content ?? null, category ?? null, id]
    );
    const [[page]] = await pool.query(
      `SELECT wp.*, u.name AS author_name
       FROM wiki_pages wp
       LEFT JOIN users u ON u.id = wp.created_by
       WHERE wp.id = ?`,
      [id]
    );
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE a page
exports.deletePage = async (req, res) => {
  try {
    await pool.query('DELETE FROM wiki_pages WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};