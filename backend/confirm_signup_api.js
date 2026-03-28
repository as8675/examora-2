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

router.post("/confirm", (req, res) => {
  const { email, code } = req.body;

  const userData = {
    Username: email,
    Pool: userPool,
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.confirmRegistration(code, true, (err, result) => {
    if (err) {
      console.error("Confirm error:", err);
      return res.status(400).json({ error: err.message });
    }

    res.json({ message: "User confirmed successfully!", result });
  });
});

module.exports = router;
