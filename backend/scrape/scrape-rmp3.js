const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Step 1: Go to the RIT professor search page
  await page.goto("https://www.ratemyprofessors.com/school/807", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  // Step 2: Search professor by name
  const professorName = "kenneth martinez";
  await page.waitForSelector('input[placeholder="Professor name"]');
  await page.fill('input[placeholder="Professor name"]', professorName);
  await page.keyboard.press("Enter");

  // Step 3: Get professor profile link (filter to RIT)
  await page.waitForSelector('a[href^="/professor/"]', { timeout: 15000 });
  const profLink = await page.$$eval('a[href^="/professor/"]', (cards) => {
    for (const card of cards) {
      if (card.innerText.includes("Rochester Institute of Technology")) {
        return card.href;
      }
    }
    return null;
  });

  if (!profLink) {
    throw new Error("❌ No professor found at Rochester Institute of Technology");
  }

  console.log("Navigating to:", profLink);

  // Step 4: Navigate to professor profile page
  await page.goto(profLink, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Step 5: Keep clicking "Load More Ratings" until all are loaded
  let keepLoading = true;
  while (keepLoading) {
    try {
      const beforeCount = await page.$$eval('[class*="Rating__RatingBody"]', (n) => n.length);

      const button = await page.$('button:has-text("Load More Ratings")');
      if (!button) {
        keepLoading = false;
        break;
      }

      console.log(`➡️ Clicking Load More Ratings (currently ${beforeCount} reviews)...`);
      await button.click();

      // Wait until more reviews are appended
      await page.waitForFunction(
        (prev) =>
          document.querySelectorAll('[class*="Rating__RatingBody"]').length > prev,
        beforeCount,
        { timeout: 10000 }
      );
    } catch {
      keepLoading = false;
    }
  }

  // Step 6: Scrape all reviews
  const reviews = await page.$$eval('[class*="Rating__RatingBody"]', (nodes) =>
    nodes.map((review) => {
      const course =
        review.querySelector('[class*="RatingHeader__StyledClass"]')?.innerText || "N/A";
      const date =
        review.querySelector('[class*="RatingHeader__RatingTimeStamp"]')?.innerText || "N/A";
      const comment =
        review.querySelector('[class*="Comments__StyledComments"]')?.innerText || "N/A";
      const quality =
        review.querySelector('[class*="CardNumRating__CardNumRatingNumber"]')?.innerText || "N/A";
      const difficulty =
        review.querySelector('[class*="Difficulty__StyledDifficultyScore"]')?.innerText || "N/A";

      return { course, date, quality, difficulty, comment };
    })
  );

  // Step 7: Save JSON file
  fs.writeFileSync(
    "professor_reviews.json",
    JSON.stringify({ professor: professorName, profile: profLink, reviews }, null, 2)
  );

  console.log(`✅ Saved ${reviews.length} reviews for ${professorName}`);

  await browser.close();
})();
