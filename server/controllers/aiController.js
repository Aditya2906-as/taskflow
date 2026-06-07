const pool = require('../db');
const { randomUUID } = require('crypto');

// ─── Groq config ─────────────────────────────────────────
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ─── AI Chat ─────────────────────────────────────────────
exports.chat = async (req, res) => {
  const { messages } = req.body;
  if (!messages?.length)
    return res.status(400).json({ error: 'messages required' });

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const systemInstructionText = `You are TaskFlow AI, a helpful productivity assistant embedded in the TaskFlow project management app.
You help users with:
- Breaking down tasks and projects into manageable steps
- Prioritizing work and managing time effectively
- Writing task descriptions, project plans, and team updates
- Suggesting best practices for project management and collaboration
- Answering general productivity and work questions

Keep responses concise, practical, and actionable. Use markdown formatting when helpful.
Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemInstructionText },
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
      return res.end();
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || 'No response from Groq';

    res.write(`data: ${JSON.stringify({ text })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};

// ─── Helper: call Groq and get project JSON ───────────────
async function callGroqForProject(prompt) {
  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_GENERATOR_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: 'You are a project management AI. Respond ONLY with valid JSON — no markdown, no explanation, no backticks.'
        },
        {
          role: 'user',
          content: `Create a detailed project board for: "${prompt}"

Respond ONLY with this exact JSON format:
{
  "boardName": "short project name (3-5 words)",
  "columns": [
    {
      "title": "column name",
      "tasks": [
        {
          "title": "task title starting with an action verb",
          "description": "2-3 sentence explanation of what this task involves, why it matters, and what done looks like",
          "daysFromNow": 7
        }
      ]
    }
  ]
}

Rules:
- Exactly 4 columns in this order: Planning, Design, Development, Testing
- Each column must have exactly 5 tasks
- Task titles must start with action verbs (Set up, Create, Build, Design, Write, Define, Test, etc.)
- Descriptions must be specific and meaningful — 2 to 3 sentences each
- daysFromNow: Planning 3-12, Design 10-22, Development 20-45, Testing 38-60
- All 20 tasks must be unique and relevant to the project`
        }
      ]
    })
  });

  const groqData = await groqRes.json();

  if (!groqData.choices?.length) {
    console.error('Groq response:', JSON.stringify(groqData, null, 2));
    throw new Error('Empty response from Groq');
  }

  const raw = groqData.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty response from Groq');

  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ─── Preview Project (returns JSON only, no DB write) ─────
exports.previewProject = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt required' });
  try {
    const data = await callGroqForProject(prompt);
    res.json(data);
  } catch (err) {
    console.error('previewProject error:', err.message);
    res.status(500).json({ error: 'AI generation failed. Please try again.' });
  }
};

// ─── Create Project (saves preview JSON to DB) ────────────
exports.createProject = async (req, res) => {
  const { preview } = req.body;
  if (!preview?.boardName || !preview?.columns?.length)
    return res.status(400).json({ error: 'Invalid preview data' });

  try {
    const boardId = randomUUID();
    await pool.query(
      'INSERT INTO boards (id,name,owner_id) VALUES (?,?,?)',
      [boardId, preview.boardName, req.userId]
    );

    const now = new Date();
    const createdColumns = [];

    for (let ci = 0; ci < preview.columns.length; ci++) {
      const col   = preview.columns[ci];
      const colId = randomUUID();

      await pool.query(
        'INSERT INTO columns (id,board_id,title,position) VALUES (?,?,?,?)',
        [colId, boardId, col.title, ci]
      );

      const colTasks = [];
      for (let ti = 0; ti < col.tasks.length; ti++) {
        const task   = col.tasks[ti];
        const taskId = randomUUID();
        const due    = new Date(now.getTime() + task.daysFromNow * 86400000)
                         .toISOString().split('T')[0];

        await pool.query(
          `INSERT INTO tasks (id,column_id,title,description,due_date,position)
           VALUES (?,?,?,?,?,?)`,
          [taskId, colId, task.title, task.description, due, ti]
        );
        colTasks.push({
          id: taskId, title: task.title, description: task.description,
          due_date: due, column_id: colId, position: ti
        });
      }
      createdColumns.push({ id: colId, title: col.title, position: ci, tasks: colTasks });
    }

    const [[board]] = await pool.query(
      `SELECT b.*, u.name AS owner_name,
        0 AS task_count, 0 AS done_count, 1 AS member_count
       FROM boards b JOIN users u ON u.id=b.owner_id WHERE b.id=?`,
      [boardId]
    );

    res.status(201).json({ board, columns: createdColumns });
  } catch (err) {
    console.error('createProject error:', err.message);
    res.status(500).json({ error: 'Failed to create board.' });
  }
};

// ─── Generate Project (old single-step, kept for compat) ──
exports.generateProject = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt required' });
  try {
    const data    = await callGroqForProject(prompt);
    const fakeReq = { body: { preview: data }, userId: req.userId };
    exports.createProject(fakeReq, res);
  } catch (err) {
    console.error('generateProject error:', err.message);
    res.status(500).json({ error: 'AI generation failed. Please try again.' });
  }
};