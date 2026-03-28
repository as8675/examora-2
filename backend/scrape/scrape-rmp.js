const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    'https://www.ratemyprofessors.com/search/professors/807?q=*',
    { waitUntil: 'domcontentloaded', timeout: 60000 }
  );

  await page.waitForSelector('.TeacherCard__StyledTeacherCard-syjs0d-0');

  const professors = await page.$$eval('.TeacherCard__StyledTeacherCard-syjs0d-0', cards => {
    return cards.map(card => {
      const name = card.querySelector('.CardName__StyledCardName-sc-1gyrgim-0')?.innerText.trim() || null;
      const rating = card.querySelector('.CardNumRating__CardNumRatingNumber-sc-17t4b9u-2')?.innerText.trim() || null;
      const department = card.querySelector('.CardSchool__Department-sc-19lmz2k-0')?.innerText.trim() || null;
      const school = card.querySelector('.CardSchool__School-sc-19lmz2k-1')?.innerText.trim() || null;
      const wouldTakeAgain = card.querySelector('.CardFeedback__CardFeedbackNumber-lq6nix-2')?.innerText.trim() || null;
      return { name, rating, department, school, wouldTakeAgain };
    });
  });

  console.log(JSON.stringify(professors, null, 2));

  await browser.close();
})();
