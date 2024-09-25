const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// Base URL of the LeetCode problem set page
const baseUrl = "https://leetcode.com/problemset/?page=";

// Function to scrape individual question details from the provided URL
const scrapeQuestionDetails = async (url) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Go to the question description page
  await page.goto(url, { waitUntil: "networkidle2" });

  // Wait for the necessary elements to load
  await page.waitForSelector(".elfjS");

  // Scrape the question description from the page
  const questionDetails = await page.evaluate(() => {
    const descriptionDiv = document.querySelector(".elfjS");
    const description = descriptionDiv
      ? descriptionDiv.innerText.trim()
      : "No description available";

    return {
      description,
    };
  });

  await browser.close();
  return questionDetails;
};

// Function to scrape data from a single page (i.e., the list of questions)
const scrapeQuestionsFromPage = async (page, pageNumber) => {
  console.log(`Scraping question list from page ${pageNumber}...`);

  // Go to the problem set page
  await page.goto(baseUrl + pageNumber, { waitUntil: "networkidle2" });

  // Wait for the table of problems to load
  await page.waitForSelector('div[role="rowgroup"]');

  // Scrape the list of questions from the page
  const questions = await page.evaluate(() => {
    const rows = document.querySelectorAll(
      'div[role="rowgroup"] div[role="row"]'
    );
    const questionList = [];

    rows.forEach((row) => {
      // Get the question name and URL
      const nameTag = row.querySelector("a[href]");
      const questionName = nameTag ? nameTag.textContent.trim() : null;
      const questionUrl = nameTag
        ? "https://leetcode.com" + nameTag.getAttribute("href")
        : null;

      // Append the question details to the list
      if (questionName && questionUrl) {
        questionList.push({
          name: questionName,
          url: questionUrl,
        });
      }
    });

    return questionList;
  });

  return questions;
};

// Main function to scrape all question pages and their details
const scrapeLeetCode = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Directory to save the question descriptions
  const descriptionDir = path.join(__dirname, "files/description");
  if (!fs.existsSync(descriptionDir)) {
    fs.mkdirSync(descriptionDir, { recursive: true });
  }

  // Loop through all the pages (1 to 66)
  for (let pageNumber = 1; pageNumber <= 1; pageNumber++) {
    const questions = await scrapeQuestionsFromPage(page, pageNumber);

    for (const question of questions) {
      console.log(`Scraping details for: ${question.url}`);

      // Extract the question slug from the URL (for file naming)
      const slug = question.url.split("/").filter(Boolean).pop();

      // Scrape the details of the individual question
      const details = await scrapeQuestionDetails(question.url);

      // Save the question details to a JSON file named after the question's slug
      const pageDir = path.join(descriptionDir, `${pageNumber}`);

      // Check if the directory for the page exists, if not, create it
      if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
      }

      // Define the output path for the question's JSON file
      const outputPath = path.join(pageDir, `${slug}.json`);

      // Write the scraped question details to the file
      fs.writeFileSync(
        outputPath,
        JSON.stringify({ url: question.url, ...details }, null, 4)
      );

      console.log(`Saved details for ${slug} to ${slug}.json`);
    }
  }

  await browser.close();
  console.log("All questions and descriptions scraped and saved successfully!");
};

// Run the main function
scrapeLeetCode();
