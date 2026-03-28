// login_api.js
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

// Login Route
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: email,
    Password: password,
  });

  const userData = {
    Username: email,
    Pool: userPool,
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: (result) => {
      const token = result.getIdToken().getJwtToken();
      res.json({
        message: "Login successful",
        token,
      });
    },
    onFailure: (err) => {
      console.error("Login error:", err);
      res.status(400).json({ error: err.message });
    },
  });
});

module.exports = router;
