// authMiddleware.js
const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const axios = require("axios");

let pemsCache = null;

async function getPems(userPoolId, region) {
  if (pemsCache) return pemsCache;

  const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  const { data } = await axios.get(url);

  const pems = {};
  data.keys.forEach((key) => {
    pems[key.kid] = jwkToPem(key);
  });

  pemsCache = pems;
  return pems;
}

module.exports = (userPoolId, region) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized: No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized: Invalid token format" });

    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) return res.status(401).json({ error: "Unauthorized: Cannot decode token" });

      const pems = await getPems(userPoolId, region);
      const pem = pems[decoded.header.kid];
      if (!pem) return res.status(401).json({ error: "Unauthorized: Invalid token key" });

      jwt.verify(token, pem, (err, payload) => {
        if (err) return res.status(401).json({ error: "Unauthorized: Invalid signature" });
        req.user = payload; 
        next();
      });
    } catch (err) {
      console.error("Token verification failed:", err);
      res.status(401).json({ error: "Unauthorized" });
    }
  };
};
