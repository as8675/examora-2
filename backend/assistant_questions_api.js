const express = require("express");
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const pdfParse = require("pdf-parse");
const multer = require("multer");

const router = express.Router();
const region = process.env.AWS_REGION || "us-east-1";
const bedrock = new BedrockRuntimeClient({ region });

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/assistant/questions
router.post("/assistant/questions", upload.single("file"), async (req, res) => {
  try {
    const { tier } = req.body;
    if (!req.file)
      return res.status(400).json({ error: "Missing file" });
    if (!tier)
      return res.status(400).json({ error: "Missing difficulty tier" });

    // 1️. Extract text from the uploaded PDF
    const parsed = await pdfParse(req.file.buffer);
    const text = (parsed.text || "").trim().slice(0, 10000); // limit to 10k chars for cost/speed

    // 2️. Create the Bedrock prompt
    const prompt = `
      You are an academic assistant generating ${tier}-level exam questions.
      Read the text below and write 10 unique, subject-relevant exam questions
      that align with the course’s difficulty level. Avoid generic or off-topic questions.
      Text:\n${text}
      Return questions as a simple numbered list (1-10).
      `;

    // 3. Call Bedrock (Claude 3 Haiku)
    // Use standard model ID format (not inference profile ARN) for portability
    const cmd = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 400,
        temperature: 0.3,
        messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      }),
    });

    const resp = await bedrock.send(cmd);
    const body = JSON.parse(new TextDecoder().decode(resp.body));
    const textOut = body?.content?.[0]?.text || "";

    // 4. Parse into an array of questions
    const questions = textOut
      .split(/\d+\.\s*/)
      .map((q) => q.trim())
      .filter((q) => q && !/^\d+$/.test(q))
      .slice(0, 10);

    res.json({ tier, questionCount: questions.length, questions });
  } catch (err) {
    console.error("Question generation error:", err);
    res.status(500).json({ error: "Failed to generate questions", details: err.message });
  }
});

module.exports = router;
