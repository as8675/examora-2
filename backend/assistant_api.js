const express = require("express");
const multer = require("multer");
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/assistant/upload
router.post("/assistant/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) 
      return res.status(400).json({ error: "Missing file" });

    console.log("Received exam upload:", {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // placeholder response
    return res.json({
      message: "File received successfully",
      topics: ["Placeholder Topic 1", "Placeholder Topic 2"],
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
