const express = require("express");
const router = express.Router();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand
} = require("@aws-sdk/lib-dynamodb");

const region = process.env.AWS_REGION || "us-east-1";
const client = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "ProfessorsReviews";

// Helper: check if timestamp is older than 1 month
function isOlderThanOneMonth(timestamp) {
  if (!timestamp) return true;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return new Date(timestamp) < oneMonthAgo;
}

router.post("/professors/sagemaker", async (req, res) => {
  const { professor, course } = req.body;

  if (!professor || !course) {
    return res
      .status(400)
      .json({ error: "Professor name and course are required" });
  }

  try {
    // Step 1: Find professor by name
    const profResult = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#n = :name",
        ExpressionAttributeNames: { "#n": "name" },
        ExpressionAttributeValues: { ":name": professor }
      })
    );

    if (!profResult.Items || profResult.Items.length === 0) {
      return res.status(404).json({ error: "Professor not found" });
    }

    const professorItem = profResult.Items[0];
    const professorId = professorItem.professor_id;

    // Step 2: Retrieve existing sentiment analysis data
    const sentimentData = await dynamodb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          professor_id: professorId,
          sort_key: `SENTIMENT#${professorId}`
        }
      })
    );

    if (!sentimentData.Item) {
      return res
        .status(404)
        .json({ error: "No sentiment data found for this professor" });
    }

    // Step 3: Filter sentiments for the given course
    const detailedSentiments = sentimentData.Item.detailedSentiments || [];
    const filteredReviews = detailedSentiments.filter(
      (s) => s.course.trim().toUpperCase() === course.trim().toUpperCase()
    );

    if (filteredReviews.length === 0) {
      return res.status(404).json({
        error: `No reviews found for course ${course} under professor ${professor}`
      });
    }

    // Step 4: Aggregate course-level sentiment
    const sentimentCounts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0, MIXED: 0 };
    filteredReviews.forEach((r) => {
      sentimentCounts[r.sentiment]++;
    });

    const total = filteredReviews.length;
    const positivity =
      ((sentimentCounts.POSITIVE + 0.5 * sentimentCounts.MIXED) / total) * 100;

    // Step 5: Infer difficulty level based on sentiment
    let difficultyLevel = "Moderate";
    if (positivity >= 70) difficultyLevel = "Easy";
    else if (positivity <= 40) difficultyLevel = "Hard";

    // Step 6: Format SageMaker-ready dataset
    const sagemakerData = filteredReviews.map((r) => ({
      course: r.course,
      sentiment: r.sentiment,
      scores: r.scores,
      text: r.review
    }));

    res.json({
      professor,
      course,
      difficultyPrediction: difficultyLevel,
      sentimentBreakdown: sentimentCounts,
      totalReviews: total,
      positivityPercentage: `${positivity.toFixed(2)}%`,
      last_analyzed: sentimentData.Item.last_analyzed,
      dataForSageMaker: sagemakerData
    });
  } catch (err) {
    console.error("SageMaker API error:", err);
    res.status(500).json({ error: "SageMaker data preparation failed" });
  }
});

module.exports = router;
