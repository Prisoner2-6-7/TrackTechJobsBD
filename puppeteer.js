const puppeteer = require("puppeteer"); 
const mongoose = require('mongoose')
require('dotenv').config(); // Load environment variables from .env
const mongoURI = process.env.MONGO_URI

// mongoose.connect(mongoURI, {})
// .then(() => console.log('connected to db'))
// .catch(err => console.log('couldnt connect to db:', err))

const requestHeaders = {
    'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    Referer: 'https://www.google.com/', };

async function selisaDetails(page) {
    
    await page.goto('https://selisegroup.com/join-the-team/', { waitUntil: 'networkidle2', timeout:0 });
    
    // Extracting all job URLs
    const jobUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.job_list_item a')).map(link => link.href);
    });
    
    if (jobUrls && jobUrls.length > 0) {
        for (let i = 0; i < jobUrls.length; i++) {
            await page.goto(jobUrls[i], { waitUntil: 'networkidle2', timeout:0 });
            
            // Extracting job details
            const jobDetails = await page.evaluate(() => {
                const jobTitleEl = document.querySelector('.single-job-title h1');
                const jobDeadlineEl = document.querySelector('.single-job-title p');
                const locationEl = document.querySelector('.location_list');
        
                // Check if elements exist before accessing their properties
                return {
                    jobTitle: jobTitleEl ? jobTitleEl.innerText.trim() : 'Job title not found',
                    jobDeadline: jobDeadlineEl ? jobDeadlineEl.innerText.trim() : 'Job Deadline not found',
                    location: locationEl ? locationEl.innerText.trim() : 'Location not found',
                };
            });
            jobDetails.jobURL = jobUrls[i];
            console.log(jobDetails);
        }
    } else {
        console.log('class not Found');
    }
}

async function trackJobPosts() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox"],
        defaultViewport: null
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Scraping from selisegroup.com with custom headers
    await page.setExtraHTTPHeaders({ ...requestHeaders });

    await selisaDetails(page);

    await browser.close();
    // await mongoose.disconnect();
}

trackJobPosts()