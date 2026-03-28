const express = require("express");
const router = express.Router();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const region = process.env.AWS_REGION || "us-east-1";
const client = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ProfessorsReviews";

function isOlderThanOneMonth(timestamp) {
  if (!timestamp) return true;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return new Date(timestamp) < oneMonthAgo;
}

// Store professors + reviews
router.post("/professors", async (req, res) => {
  const { professor, profile, reviews } = req.body;
  const professorId = profile.split("/").pop();

  try {
    const profResult = await dynamodb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { professor_id: professorId, sort_key: `PROF#${professorId}` }
    }));

    let needRescrape = false;
    if (!profResult.Item) needRescrape = true;
    else if (isOlderThanOneMonth(profResult.Item.last_scraped)) needRescrape = true;

    let insertedCount = 0, skippedCount = 0;

    if (needRescrape) {
      await dynamodb.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          professor_id: professorId,
          sort_key: `PROF#${professorId}`,
          name: professor,
          profile_url: profile,
          last_scraped: new Date().toISOString()
        }
      }));

      for (let r of reviews) {
        const reviewKey = `REV#${r.date}#${r.course}`;
        try {
          await dynamodb.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              professor_id: professorId,
              sort_key: reviewKey,
              course: r.course,
              review_date: r.date,
              quality: r.quality,
              difficulty: r.difficulty,
              comment: r.comment
            },
            ConditionExpression: "attribute_not_exists(sort_key)"
          }));
          insertedCount++;
        } catch (err) {
          if (err.name === "ConditionalCheckFailedException") skippedCount++;
          else throw err;
        }
      }
    }

    const reviewsResult = await dynamodb.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "professor_id = :pid AND begins_with(sort_key, :rev)",
      ExpressionAttributeValues: { ":pid": professorId, ":rev": "REV#" }
    }));

    res.json({
      professor,
      reviews: reviewsResult.Items,
      inserted: insertedCount,
      skipped: skippedCount,
      source: needRescrape ? "rescraped " : "cache "
    });
  } catch (err) {
    console.error("DynamoDB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
