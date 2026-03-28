const express = require("express");
const router = express.Router();
const { chromium } = require("playwright");
const axios = require("axios");

router.post("/professor", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Professor name required" });

  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto("https://www.ratemyprofessors.com/school/807", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForSelector('input[placeholder="Professor name"]');
    await page.fill('input[placeholder="Professor name"]', name);
    await page.keyboard.press("Enter");

    await page.waitForSelector('a[href^="/professor/"]', { timeout: 15000 });
    const profLink = await page.$$eval('a[href^="/professor/"]', (cards) => {
      for (const card of cards) {
        if (card.innerText.includes("Rochester Institute of Technology")) {
          const href = card.getAttribute("href");
          return href.startsWith("http")
            ? href
            : `https://www.ratemyprofessors.com${href}`;
        }
      }
      return null;
    });

    if (!profLink) {
      await browser.close();
      return res.status(404).json({ error: "Professor not found" });
    }

    await page.goto(profLink, { waitUntil: "domcontentloaded", timeout: 60000 });

    // scraping loop ...
    let keepLoading = true;
    while (keepLoading) {
      try {
        const beforeCount = await page.$$eval('[class*="Rating__RatingBody"]', (n) => n.length);
        const button = await page.$('button:has-text("Load More Ratings")');
        if (!button) {
          keepLoading = false;
          break;
        }
        await button.click();
        await page.waitForFunction(
          (prev) => document.querySelectorAll('[class*="Rating__RatingBody"]').length > prev,
          beforeCount,
          { timeout: 10000 }
        );
      } catch {
        keepLoading = false;
      }
    }

    const reviews = await page.$$eval('[class*="Rating__RatingBody"]', (nodes) =>
      nodes.map((review) => {
        const course = review.querySelector('[class*="RatingHeader__StyledClass"]')?.innerText || "N/A";
        const date = review.querySelector('[class*="RatingHeader__RatingTimeStamp"]')?.innerText || "N/A";
        const comment = review.querySelector('[class*="Comments__StyledComments"]')?.innerText || "N/A";

        let quality = "N/A";
        let difficulty = "N/A";
        const ratingBlocks = review.querySelectorAll('[class*="CardNumRating__StyledCardNumRating"]');
        ratingBlocks.forEach((block) => {
          const label = block.querySelector('[class*="CardNumRating__CardNumRatingHeader"]')?.innerText?.trim();
          const value = block.querySelector('[class*="CardNumRating__CardNumRatingNumber"]')?.innerText?.trim();
          if (label && value) {
            if (label.toLowerCase().includes("quality")) quality = value;
            if (label.toLowerCase().includes("difficulty")) difficulty = value;
          }
        });

        return { course, date, quality, difficulty, comment };
      })
    );

    await browser.close();

    // Send to professors API for storage
    await axios.post(
      "http://localhost:3000/api/professors",
      {
        professor: name,
        profile: profLink,
        reviews: reviews,
      },
      {
        headers: {
          Authorization: req.headers.authorization,  // forward the client’s token
        },
      }
    );


    res.json({
      message: "Professor scraped and saved",
      professor: name,
      profile: profLink,
      reviewsCount: reviews.length,
    });
  } catch (err) {
    console.error("Scraping error:", err);
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
});

module.exports = router;
