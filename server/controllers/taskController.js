const pool = require('../db');
const { randomUUID } = require('crypto');

exports.createTask = async (req, res) => {
  const { columnId, title, description, dueDate, assigneeId, priority } = req.body;
  if (!columnId || !title?.trim())
    return res.status(400).json({ error: 'columnId and title required' });
  try {
    const [[pos]] = await pool.query(
      'SELECT COALESCE(MAX(position),0)+1 AS pos FROM tasks WHERE column_id=?', [columnId]
    );
    const id = randomUUID();
    await pool.query(
      `INSERT INTO tasks (id,column_id,title,description,due_date,assignee_id,position,priority)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, columnId, title.trim(), description||null, dueDate||null, assigneeId||null, pos.pos, priority||'medium']
    );
    const [[task]] = await pool.query(
      `SELECT t.*, u.name AS assignee_name FROM tasks t
       LEFT JOIN users u ON u.id=t.assignee_id WHERE t.id=?`, [id]
    );
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, assigneeId, columnId, position, priority } = req.body;
  try {
    await pool.query(
      `UPDATE tasks SET
         title       = COALESCE(?,title),
         description = COALESCE(?,description),
         due_date    = COALESCE(?,due_date),
         assignee_id = COALESCE(?,assignee_id),
         column_id   = COALESCE(?,column_id),
         position    = COALESCE(?,position),
         priority    = COALESCE(?,priority)
       WHERE id=?`,
      [title,description,dueDate,assigneeId,columnId,position,priority,id]
    );
    const [[task]] = await pool.query(
      `SELECT t.*, u.name AS assignee_name FROM tasks t
       LEFT JOIN users u ON u.id=t.assignee_id WHERE t.id=?`, [id]
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id=?', [req.params.id]);
  res.json({ success: true });
};