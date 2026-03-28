const express = require("express");
const router = express.Router();
const multer = require("multer");
const { TextractClient, DetectDocumentTextCommand } = require("@aws-sdk/client-textract");
const { ComprehendClient, DetectKeyPhrasesCommand } = require("@aws-sdk/client-comprehend");
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const pdfParse = require("pdf-parse");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const region = process.env.AWS_REGION || "us-east-1";
const textract = new TextractClient({ region });
const comprehend = new ComprehendClient({ region });
const bedrock = new BedrockRuntimeClient({ region });

router.post("/syllabus/topics", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Missing PDF file under field 'file'" });
        }
        const mime = req.file.mimetype || "";
        let fullText = "";

        if (/application\/(pdf)/i.test(mime)) {
            const parsed = await pdfParse(req.file.buffer);
            fullText = (parsed.text || "").trim();
        } else if (/image\/(png|jpeg|jpg|tiff)/i.test(mime)) {
            const detect = new DetectDocumentTextCommand({ Document: { Bytes: req.file.buffer } });
            const detectResp = await textract.send(detect);
            const lines = (detectResp.Blocks || [])
                .filter((b) => b.BlockType === "LINE" && b.Text)
                .map((b) => b.Text);
            fullText = lines.join("\n");
        } else {
            return res.status(400).json({ error: "Unsupported file type. Upload a PDF or image." });
        }

        if (!fullText || fullText.length < 10) {
            return res.status(200).json({ topics: [], textLength: 0 });
        }

        async function summarizeTopics(text) {
            try {
                const prompt = `You are an academic assistant. Read this course syllabus text and
                extract 10 concise, subject-relevant topics that describe what is TAUGHT or COVERED in the course.
                Avoid filler words like instructor, project, grading, students, class, etc.
                Return topics as a comma-separated list.
                Text:\n\n${text.slice(0, 8000)}`;

                const cmd = new InvokeModelCommand({
                    modelId: "anthropic.claude-3-haiku-20240307-v1:0",
                    contentType: "application/json",
                    accept: "application/json",
                    body: JSON.stringify({
                        anthropic_version: "bedrock-2023-05-31",
                        max_tokens: 200,
                        temperature: 0,
                        messages: [{ role: "user", content: [{ type: "text", text: prompt }] }]
                    }),
                });

                const resp = await bedrock.send(cmd);
                const body = JSON.parse(new TextDecoder().decode(resp.body));
                const textOut = body?.content?.[0]?.text || "";

                if (!textOut) return ["No topics extracted"];

                // FIX: Updated regex to split on commas/newlines, not "n"
                // Also filters out bullet points and short garbage strings
                const topics = textOut
                    .split(/[,\n;]+/) 
                    .map(t => t.replace(/^[•\-\*]\s*/, '').trim())
                    .filter(t => t.length > 2 && !t.toLowerCase().includes("topics:"))
                    .slice(0, 10);
                
                return topics;

            } catch (error) {
                console.error("Error in summarizeTopics:", error);
                return ["Error extracting topics"];
            }
        }

        const topics = await summarizeTopics(fullText);

        return res.json({
            topics: topics || [],
            textLength: fullText.length,
            status: "success"
        });

    } catch (err) {
        console.error("Syllabus topics error:", err);
        res.status(500).json({ error: "Failed to extract topics" });
    }
});

module.exports = router;