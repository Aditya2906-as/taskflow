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