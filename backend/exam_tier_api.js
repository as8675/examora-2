const express = require("express");
const router = express.Router();

// POST /api/assistant/tier
router.post("/assistant/tier", async (req, res) => {
  try {
    const { sentimentBreakdown, avgDifficulty } = req.body;
    if (!sentimentBreakdown)
      return res.status(400).json({ error: "Missing sentimentBreakdown" });

    // total reviews counted
    const total =
      (sentimentBreakdown.POSITIVE || 0) +
      (sentimentBreakdown.NEGATIVE || 0) +
      (sentimentBreakdown.NEUTRAL || 0) +
      (sentimentBreakdown.MIXED || 0);

    const negPct = total ? (sentimentBreakdown.NEGATIVE || 0) / total : 0;

    // base difficulty from professor ratings  (1 = Easy, 5 = Hard)
    let base = avgDifficulty || 3.0;
    if (negPct >= 0.5) base += 0.7;
    else if (negPct >= 0.35) base += 0.4;
    else if (negPct >= 0.2) base += 0.2;
    else base -= 0.1;

    const score = Math.max(1, Math.min(5, base));
    const tier = score >= 4.2 ? "Hard" : score >= 3.0 ? "Medium" : "Easy";

    res.json({
      tier,
      score: +score.toFixed(2),
      negPct: +negPct.toFixed(2)
    });
  } catch (err) {
    console.error("Tier calc error:", err);
    res.status(500).json({ error: "Failed to compute tier" });
  }
});

module.exports = router;
