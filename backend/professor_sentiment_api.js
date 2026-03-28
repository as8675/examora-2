const express = require("express");
const router = express.Router();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  GetCommand,
  ScanCommand
} = require("@aws-sdk/lib-dynamodb");
const {
  ComprehendClient,
  DetectSentimentCommand
} = require("@aws-sdk/client-comprehend");

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamodb = DynamoDBDocumentClient.from(client);
const comprehend = new ComprehendClient({ region: "us-east-1" });

const TABLE_NAME = "ProfessorsReviews";

// Helper: check if timestamp is older than 1 month
function isOlderThanOneMonth(timestamp) {
  if (!timestamp) return true;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return new Date(timestamp) < oneMonthAgo;
}

// Helper: Consistent Tier Logic
function calculateTier(sentimentCounts) {
  const total = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);
  const negPct = total ? sentimentCounts.NEGATIVE / total : 0;

  // REVISED LOGIC:
  // > 60% Negative -> Students say "Too Hard" -> Suggest "Easy" exam
  // 40-60% Negative -> Mixed -> Suggest "Medium" exam
  // < 40% Negative -> Students say "Easy" -> Suggest "Hard" exam
  
  if (negPct > 0.60) return "Easy";
  if (negPct >= 0.40) return "Medium";
  return "Hard";
}

router.post("/professors/sentiment", async (req, res) => {
  const { professor, name, force } = req.body;
  const profName = name || professor;

  if (!profName)
    return res.status(400).json({ error: "Professor name required" });

  try {
    // Step 1: Find professor by name
    const profResult = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#n = :name",
        ExpressionAttributeNames: { "#n": "name" },
        ExpressionAttributeValues: { ":name": profName }
      })
    );

    if (!profResult.Items || profResult.Items.length === 0)
      return res.status(404).json({ error: "Professor not found" });

    const professorItem = profResult.Items[0];
    const professorId = professorItem.professor_id;

    // Step 2: Check if cached sentiment data exists and is still fresh
    const sentimentResult = await dynamodb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          professor_id: professorId,
          sort_key: `SENTIMENT#${professorId}`
        }
      })
    );

    if (
      !force &&
      sentimentResult.Item &&
      !isOlderThanOneMonth(sentimentResult.Item.last_analyzed) &&
      Array.isArray(sentimentResult.Item.detailedSentiments) &&
      sentimentResult.Item.detailedSentiments.length > 0
    ) {
      // HOTFIX: Recalculate tier from the raw counts to ignore old cached "Easy" labels
      const freshTier = calculateTier(sentimentResult.Item.sentimentBreakdown);

      return res.json({
        professor: profName,
        sentimentBreakdown: sentimentResult.Item.sentimentBreakdown,
        detailedSentiments: sentimentResult.Item.detailedSentiments,
        difficultyTier: freshTier, // Use the recalculated tier
        totalReviews: sentimentResult.Item.totalReviews || 0,
        source: "cached",
        last_analyzed: sentimentResult.Item.last_analyzed
      });
    }

    // Step 3: Fetch all reviews for this professor
    const reviewsResult = await dynamodb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression:
          "professor_id = :pid AND begins_with(sort_key, :rev)",
        ExpressionAttributeValues: { ":pid": professorId, ":rev": "REV#" }
      })
    );

    const reviews = reviewsResult.Items || [];
    if (reviews.length === 0)
      return res
        .status(404)
        .json({ error: "No reviews found for sentiment analysis" });

    // Step 4: Analyze each comment using AWS Comprehend
    const sentimentCounts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0, MIXED: 0 };
    const detailedResults = [];

    for (const review of reviews) {
      if (!review.comment) continue;

      const command = new DetectSentimentCommand({
        Text: review.comment,
        LanguageCode: "en"
      });
      const response = await comprehend.send(command);

      sentimentCounts[response.Sentiment]++;

      detailedResults.push({
        course: review.course || "Unknown",
        review: review.comment,
        sentiment: response.Sentiment,
        scores: response.SentimentScore
      });
    }

    const tier = calculateTier(sentimentCounts);

    // Step 5: Save sentiment results to DynamoDB
    const resultItem = {
      professor_id: professorId,
      sort_key: `SENTIMENT#${professorId}`,
      type: "sentiment",
      name: profName,
      sentimentBreakdown: sentimentCounts,
      detailedSentiments: detailedResults,
      totalReviews: reviews.length,
      last_analyzed: new Date().toISOString(),
      difficultyTier: tier
    };

    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: resultItem
      })
    );

    // Step 6: Return full response
    res.json({
      professor: profName,
      sentimentBreakdown: sentimentCounts,
      detailedSentiments: detailedResults,
      totalReviews: reviews.length,
      difficultyTier: tier,
      source: "fresh",
      last_analyzed: resultItem.last_analyzed
    });
  } catch (err) {
    console.error("Sentiment analysis error:", err);
    res.status(500).json({ error: "Sentiment analysis failed" });
  }
});

module.exports = router;