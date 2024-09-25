const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Base URL of the LeetCode problem set page
const baseUrl = 'https://leetcode.com/problemset/?page=';

// Function to scrape data from a single page
const scrapePage = async (page, pageNumber) => {
  console.log(`Scraping page ${pageNumber}...`);

  // Go to the page
  await page.goto(baseUrl + pageNumber, { waitUntil: 'networkidle2' });

  // Wait for the table of problems to load
  await page.waitForSelector('div[role="rowgroup"]');

  // Scrape data from the page
  const questions = await page.evaluate(() => {
    const rows = document.querySelectorAll('div[role="rowgroup"] div[role="row"]');
    const questionList = [];

    rows.forEach((row) => {
      // Get the question name and URL
      const nameTag = row.querySelector('a[href]');
      const questionName = nameTag ? nameTag.textContent.trim() : null;
      const questionUrl = nameTag ? 'https://leetcode.com' + nameTag.getAttribute('href') : null;

      // Get the difficulty level from the second-to-last div
      const difficultyTag = row.querySelector('div[role="cell"]:nth-last-child(2) span');
      const difficulty = difficultyTag ? difficultyTag.textContent.trim() : 'Unknown';

      // Append the question details to the list
      if (questionName && questionUrl) {
        questionList.push({
          name: questionName,
          url: questionUrl,
          difficulty: difficulty
        });
      }
    });

    return questionList;
  });

  return questions;
};

// Function to scrape LeetCode data across multiple pages
const scrapeLeetCode = async () => {
  try {
    // Launch puppeteer browser
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Directory to save the files
    const directory = path.join(__dirname, 'files/problemset');
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Loop through pages 1 to 66
    for (let i = 1; i <= 66; i++) {
      const questions = await scrapePage(page, i);

      // Save the scraped data to a JSON file for each page
      fs.writeFileSync(path.join(directory, `page${i}.json`), JSON.stringify(questions, null, 4));

      console.log(`Saved page ${i} data to page${i}.json`);
    }

    // Close the browser
    await browser.close();
    console.log('Scraping completed successfully!');

  } catch (error) {
    console.error('Error fetching or processing the data:', error);
  }
};

// Run the function
scrapeLeetCode();
