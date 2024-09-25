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
const scrapeQuestionsFromPage = async (pageNumber) => {
  console.log(`Loading questions from page ${pageNumber}...`);

  // Path to the locally stored JSON file
  const filePath = path.join(__dirname, 'files', 'problemset', `page${pageNumber}.json`);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File for page ${pageNumber} not found: ${filePath}`);
  }

  // Read the file contents and parse the JSON data
  const fileContents = fs.readFileSync(filePath, 'utf-8');
  const questions = JSON.parse(fileContents);

  return questions;
};

// Main function to scrape all question pages and their details
const scrapeLeetCode = async () => {
  

  // Directory to save the question descriptions
  const descriptionDir = path.join(__dirname, "files/description");
  if (!fs.existsSync(descriptionDir)) {
    fs.mkdirSync(descriptionDir, { recursive: true });
  }

  // Loop through all the pages (1 to 66)
  for (let pageNumber = 1; pageNumber <= 1; pageNumber++) {
    const questions = await scrapeQuestionsFromPage( pageNumber);

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

  console.log("All questions and descriptions scraped and saved successfully!");
};

// Run the main function
scrapeLeetCode();
