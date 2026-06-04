const pool = require('../db');
const { randomUUID } = require('crypto');

exports.sendInvite = async (req, res) => {
  const { boardId, receiverEmail } = req.body;
  const io = req.app.get('io');
  try {
    // Find receiver
    const [users] = await pool.query(
      'SELECT id,name,email FROM users WHERE email=?', [receiverEmail]
    );
    if (!users.length)
      return res.status(404).json({ error: 'No user found with that email' });
    const receiver = users[0];

    // Can't invite yourself
    if (receiver.id === req.userId)
      return res.status(400).json({ error: 'You cannot invite yourself' });

    // Already a member?
    const [mem] = await pool.query(
      `SELECT 1 FROM board_members WHERE board_id=? AND user_id=?
       UNION SELECT 1 FROM boards WHERE id=? AND owner_id=?`,
      [boardId, receiver.id, boardId, receiver.id]
    );
    if (mem.length)
      return res.status(400).json({ error: 'User is already a member' });

    // Already invited?
    const [exist] = await pool.query(
      `SELECT id FROM invitations WHERE board_id=? AND receiver_id=? AND status='pending'`,
      [boardId, receiver.id]
    );
    if (exist.length)
      return res.status(400).json({ error: 'Invite already sent' });

    // Get board info
    const [[board]] = await pool.query('SELECT name FROM boards WHERE id=?', [boardId]);
    const [[sender]] = await pool.query('SELECT name FROM users WHERE id=?', [req.userId]);

    const id = randomUUID();
    await pool.query(
      'INSERT INTO invitations (id,board_id,sender_id,receiver_id) VALUES (?,?,?,?)',
      [id, boardId, req.userId, receiver.id]
    );

    // Create notification for receiver
    const notifId = randomUUID();
    const notifData = JSON.stringify({ inviteId: id, boardId, boardName: board.name, senderName: sender.name });
    await pool.query(
      `INSERT INTO notifications (id,user_id,type,title,body,data)
       VALUES (?,?,'invite',?,?,?)`,
      [notifId, receiver.id,
       `Board invitation from ${sender.name}`,
       `You've been invited to join "${board.name}"`,
       notifData]
    );

    // Push real-time notification
    io.sendToUser(receiver.id, 'new-notification', {
      id: notifId,
      type: 'invite',
      title: `Board invitation from ${sender.name}`,
      body: `You've been invited to join "${board.name}"`,
      data: { inviteId: id, boardId, boardName: board.name, senderName: sender.name },
      is_read: false,
      created_at: new Date()
    });

    res.status(201).json({ message: 'Invitation sent', inviteId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.respondToInvite = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'accepted' or 'declined'
  const io = req.app.get('io');

  if (!['accepted','declined'].includes(action))
    return res.status(400).json({ error: 'action must be accepted or declined' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM invitations WHERE id=? AND receiver_id=?',
      [id, req.userId]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Invite not found' });
    const invite = rows[0];
    if (invite.status !== 'pending')
      return res.status(400).json({ error: 'Invite already responded to' });

    await pool.query(
      'UPDATE invitations SET status=? WHERE id=?', [action, id]
    );

    if (action === 'accepted') {
      await pool.query(
        'INSERT IGNORE INTO board_members (board_id,user_id) VALUES (?,?)',
        [invite.board_id, req.userId]
      );
      // Notify sender
      const [[accepter]] = await pool.query('SELECT name FROM users WHERE id=?', [req.userId]);
      const [[board]]    = await pool.query('SELECT name FROM boards WHERE id=?', [invite.board_id]);
      const notifId = randomUUID();
      await pool.query(
        `INSERT INTO notifications (id,user_id,type,title,body,data)
         VALUES (?,?,'invite_accepted',?,?,?)`,
        [notifId, invite.sender_id,
         `${accepter.name} accepted your invite`,
         `${accepter.name} joined "${board.name}"`,
         JSON.stringify({ boardId: invite.board_id })]
      );
      io.sendToUser(invite.sender_id, 'new-notification', {
        id: notifId, type: 'invite_accepted',
        title: `${accepter.name} accepted your invite`,
        body: `${accepter.name} joined "${board.name}"`,
        data: { boardId: invite.board_id },
        is_read: false, created_at: new Date()
      });
      // Refresh sender's dashboard
      io.sendToUser(invite.sender_id, 'refresh-dashboard', {});
    }

    // Mark related notification as read
    await pool.query(
      `UPDATE notifications SET is_read=TRUE
       WHERE user_id=? AND type='invite' AND JSON_EXTRACT(data,'$.inviteId')=?`,
      [req.userId, id]
    );

    res.json({ success: true, action });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyInvites = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, b.name AS board_name, u.name AS sender_name
       FROM invitations i
       JOIN boards b ON b.id=i.board_id
       JOIN users u  ON u.id=i.sender_id
       WHERE i.receiver_id=? AND i.status='pending'
       ORDER BY i.created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};