const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: true }); // run browser invisibly
  const page = await browser.newPage();

  // Step 1: Go to the RIT professor search page
  await page.goto("https://www.ratemyprofessors.com/school/807", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  // Step 2: Search for professor by name
  const professorName = "Robert St Jacques"; // you can change this dynamically
  await page.waitForSelector('input[placeholder="Professor name"]');
  await page.fill('input[placeholder="Professor name"]', professorName);
  await page.keyboard.press("Enter");

  // Step 3: Wait for professor profile link to appear
  await page.waitForSelector('a[href^="/professor/"]', { timeout: 15000 });
  const profLink = await page.$eval('a[href^="/professor/"]', (a) => a.href);

  console.log("Navigating to:", profLink);

  // Step 4: Navigate to professor profile page
  await page.goto(profLink, { waitUntil: "domcontentloaded", timeout: 60000 });

  // Step 5: Wait for reviews container
  await page.waitForSelector('[class*="Rating__RatingBody"]', { timeout: 15000 });

  // Step 6: Extract all reviews (course + feedback + extras)
  const reviews = await page.$$eval('[class*="Rating__RatingBody"]', (nodes) =>
    nodes.map((review) => {
      const course =
        review.querySelector('[class*="RatingHeader__StyledClass"]')?.innerText ||
        "N/A";
      const date =
        review.querySelector('[class*="RatingHeader__RatingTimeStamp"]')
          ?.innerText || "N/A";
      const comment =
        review.querySelector('[class*="Comments__StyledComments"]')?.innerText ||
        "N/A";
      const quality =
        review.querySelector('[class*="CardNumRating__CardNumRatingNumber"]')
          ?.innerText || "N/A";
      const difficulty =
        review.querySelector('[class*="Difficulty__StyledDifficultyScore"]')
          ?.innerText || "N/A";

      return { course, date, quality, difficulty, comment };
    })
  );

  // Step 7: Save as JSON file
  fs.writeFileSync(
    "professor_reviews.json",
    JSON.stringify({ professor: professorName, profile: profLink, reviews }, null, 2)
  );

  console.log(`✅ Saved ${reviews.length} reviews for ${professorName}`);

  await browser.close();
})();
