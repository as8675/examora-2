// signup_api.js
const express = require("express");
const router = express.Router();
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const dotenv = require("dotenv");
global.fetch = require("node-fetch"); 

dotenv.config();

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_CLIENT_ID,
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// Signup Route
router.post("/signup", (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      error: "email, password, and name are required",
    });
  }

  const attributeList = [
    new AmazonCognitoIdentity.CognitoUserAttribute({
      Name: "email",
      Value: email,
    }),
    new AmazonCognitoIdentity.CognitoUserAttribute({
      Name: "name",
      Value: name, 
    }),
  ];

  userPool.signUp(email, password, attributeList, null, (err, result) => {
    if (err) {
      console.error("Signup error:", err);
      return res.status(400).json({ error: err.message });
    }

    const cognitoUser = result.user;
    res.json({
      message: "Signup successful. Confirm email with the code sent.",
      username: cognitoUser.getUsername(),
    });
  });
});

module.exports = router;
