const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const authMiddleware = require("./authMiddleware");
const assistantRoutes = require("./assistant_api");

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Health check route (early) for ALB target group
app.get("/", (req, res) => res.status(200).send("OK"));

app.use(
  cors({
    // Allow your ALB URL and localhost (for local testing)
    origin: [
      "http://localhost:8080", 
      "http://examora-alb-945905355.us-east-1.elb.amazonaws.com"
    ], 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Get env vars
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const region = process.env.AWS_REGION;

// Routes
const signupRoutes = require("./signup_api");
const loginRoutes = require("./login_api");
const scrapeRoutes = require("./scrape/scrape_api");
const professorRoutes = require("./professor_api");
const confirmSignupRoutes = require("./confirm_signup_api");
const sentimentRoutes = require("./professor_sentiment_api");
const sagemakerRoutes = require("./professor_sagemaker_api");
const syllabusRoutes = require("./syllabus_api");
const examTierRoutes = require("./exam_tier_api");
const assistantQuestionsRoutes = require("./assistant_questions_api");


// Public routes (no token needed)
app.use("/auth", signupRoutes);
app.use("/auth", loginRoutes);
app.use("/auth", confirmSignupRoutes);

// Protected routes (require Cognito token)
app.use("/scrape", authMiddleware(userPoolId, region), scrapeRoutes);
app.use("/api", authMiddleware(userPoolId, region), professorRoutes);
app.use("/api", authMiddleware(userPoolId, region), sentimentRoutes);
app.use("/api", authMiddleware(userPoolId, region), sagemakerRoutes);
app.use("/api", authMiddleware(userPoolId, region), syllabusRoutes);
app.use("/api", authMiddleware(userPoolId, region), assistantRoutes);
app.use("/api", authMiddleware(userPoolId, region), examTierRoutes);
app.use("/api", authMiddleware(userPoolId, region), assistantQuestionsRoutes);

// Health check route
app.get("/", (req, res) => res.status(200).send("OK"));

app.listen(3000, "0.0.0.0", () => {
  console.log("Master API running on port 3000 (0.0.0.0)");
});
