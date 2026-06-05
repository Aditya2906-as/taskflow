const pool = require('../db');
exports.chat = async (req, res) => {
  const { messages } = req.body;
  if (!messages?.length)
    return res.status(400).json({ error: 'messages required' });

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Use Gemini 2.5 Flash (or your preferred Gemini model) and the correct streaming endpoint
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Map incoming messages to Gemini's strict format { role: 'user'|'model', parts: [{ text: '' }] }
    const formattedMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const systemInstructionText = `You are TaskFlow AI, a helpful productivity assistant embedded in the TaskFlow project management app.
You help users with:
- Breaking down tasks and projects into manageable steps
- Prioritizing work and managing time effectively
- Writing task descriptions, project plans, and team updates
- Suggesting best practices for project management and collaboration
- Answering general productivity and work questions

Keep responses concise, practical, and actionable. Use markdown formatting when helpful.
Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY, // Uses your Gemini environment variable
      },
      body: JSON.stringify({
        contents: formattedMessages,
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        },
        generationConfig: {
          maxOutputTokens: 1024
        }
      })
    })
    console.log(await response.clone().text());

    if (!response.ok) {
      const err = await response.text();
      res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
      return res.end();
    }

    // const reader = response.body.getReader();
   const data = await response.json();

    console.log("Gemini response:", JSON.stringify(data, null, 2));

    const text =
    data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "No response from Gemini";

    res.write(
    `data: ${JSON.stringify({
        text
    })}\n\n`
    );

    res.write("data: [DONE]\n\n");
    res.end()
    } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};


// ─── AI Project Generator ─────────────────────────────────
const { randomUUID } = require('crypto');

exports.generateProject = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt?.trim())
    return res.status(400).json({ error: 'Prompt required' });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create a project board for: "${prompt}"
                Respond ONLY in JSON, no markdown.
                {"boardName":"string","columns":[{"title":"string","tasks":[{"title":"string","description":"string","daysFromNow":number}]}]}
                Rules: 4 columns (Planning,Design,Development,Testing), 4 tasks each, daysFromNow spread 1-60.`            }]
          }]
        })
      }
    );

    const geminiData = await geminiRes.json();
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('Gemini full response:', JSON.stringify(geminiData, null, 2));
      throw new Error('Empty response from Gemini');
    }
    const raw = geminiData.candidates[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      console.error('Gemini candidate:', JSON.stringify(geminiData.candidates[0], null, 2));
      throw new Error('Empty response from Gemini');
    }

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const data    = JSON.parse(cleaned);

    // ── Create board in DB ──
    const boardId = randomUUID();
    await pool.query(
      'INSERT INTO boards (id,name,owner_id) VALUES (?,?,?)',
      [boardId, data.boardName, req.userId]
    );

    const now = new Date();
    const createdColumns = [];

    for (let ci = 0; ci < data.columns.length; ci++) {
      const col   = data.columns[ci];
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
    console.error('generateProject error:', err.message);
    res.status(500).json({ error: 'AI generation failed. Please try again.' });
  }
};