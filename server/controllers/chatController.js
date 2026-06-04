const pool = require('../db');

exports.getMessages = async (req, res) => {
  const { boardId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT cm.*, u.name AS sender_name FROM chat_messages cm
       JOIN users u ON u.id=cm.user_id
       WHERE cm.board_id=?
       ORDER BY cm.created_at ASC LIMIT 100`,
      [boardId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};