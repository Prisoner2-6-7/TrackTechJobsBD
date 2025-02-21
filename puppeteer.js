const puppeteer = require("puppeteer"); 
const mongoose = require('mongoose')
// const fetch = require('node-fetch');

require('dotenv').config(); // Load environment variables from .env
const mongoURI = process.env.MONGO_URI

mongoose.connect(mongoURI, {})
.then(() => console.log('connected to db'))
.catch(err => console.log('couldnt connect to db:', err))

const { getJobDetailModel } = require('./schemas/jobDetails'); // Modified: import helper

// For Selise jobs:
const seliseModel = getJobDetailModel('selise');

// or for Ollyo jobs:
const enosisbdModel = getJobDetailModel('enosisbd');

const cefaloModel = getJobDetailModel('cefalo');

const requestHeaders = {
    'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    Referer: 'https://www.google.com/', };

async function seliseDetails(page) {
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
                    jobLocation: locationEl ? locationEl.innerText.trim() : 'Location not found',
                };
            });
            jobDetails.jobURL = jobUrls[i];
            
            try {
                // Modified: Check if job already exists based on jobTitle and jobDeadline
                const exists = await seliseModel.findOne({ 
                    jobTitle: jobDetails.jobTitle,       // Modified: checking by jobTitle
                    jobDeadline: jobDetails.jobDeadline    // Modified: checking by jobDeadline
                });
                
                if (!exists) {
                    await seliseModel.create(jobDetails);   // Modified: inserting jobDetails into MongoDB if non-duplicate
                    console.log(`Job added to MongoDB: ${jobDetails.jobTitle}`); // Modified: log insertion success
                } else {
                    console.log(`Duplicate job found, skipping: ${jobDetails.jobTitle}`); // Modified: log duplicate job
                }
            } catch (error) {
                console.error("Error saving job details:", error); // Modified: log insertion error
            }
        }
    } else {
        console.log('class not Found');
    }
}

async function cefaloDetails(page) {
    await page.goto('https://career.cefalo.com/#openJobs', { waitUntil: 'networkidle2', timeout:0 });
    
    const jobUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.job-card a')).map(link => link.href);
    });
    
    if (jobUrls && jobUrls.length > 0) {
        for (let i = 0; i < jobUrls.length; i++) {
            await  page.goto(jobUrls[i], { waitUntil: 'networkidle2', timeout:0 });
            
                // Extracting job details
                const jobDetails = await page.evaluate(() => {
                    const jobTitleEl = document.querySelector('.main-title');
                    
                    const jobDeadlineEl = Array.from(document.querySelectorAll('strong'))
                    .find(el => el.innerText.includes('Application Deadline'));
                    
                    const jobTitle = jobTitleEl ? jobTitleEl.innerText.trim() : 'Job title not found'
            
                    const jobDeadline = jobDeadlineEl && jobDeadlineEl.nextElementSibling
                    ? jobDeadlineEl.nextElementSibling.innerText.trim()
                    : 'Deadline not found';

                    return {
                        jobTitle,
                        jobDeadline,
                        };
                    });

                    const liElements = await page.$$('article > div > ul:nth-child(12) > li');
                    const location = await page.evaluate((el) => el.innerText, liElements[0]);        
                    
                    jobDetails.jobURL = jobUrls[i];
                    jobDetails.jobLocation = location;
                    
                    // Uploading details to MongoDB
                    try {
                        // Modified: Check if job already exists based on jobTitle and jobDeadline
                        const exists = await cefaloModel.findOne({ 
                            jobTitle: jobDetails.jobTitle,       // Modified: checking by jobTitle
                            jobDeadline: jobDetails.jobDeadline    // Modified: checking by jobDeadline
                        });

                        if (!exists) {
                            await cefaloModel.create(jobDetails);   // Modified: inserting jobDetails into MongoDB if non-duplicate
                            console.log(`Job added to MongoDB: ${jobDetails.jobTitle}`); // Modified: log insertion success
                        } else {
                            console.log(`Duplicate job found, skipping: ${jobDetails.jobTitle}`); // Modified: log duplicate job
                        }
                    } catch (error) {
                        console.error("Error saving job details:", error); // Modified: log insertion error
                    }
    }}
     else {
        console.log('Cafelo jobUrls not Found');
        }
}

async function enosisbdDetails() {
    const url = 'https://enosisbd.pinpointhq.com/postings.json?_=1740159075778';
    const response = await fetch(url);
    const data = await response.json();
    const jobDetails = data.data.map(job => {
        return {
            jobTitle: job.location.city,
            jobDeadline: job.deadline_at,
            jobURL: job.title,
            jobLocation: job.url,
        };
    });

    // Uploading details to MongoDB
    for (let i = 0; i < jobDetails.length; i++) {
        try {
            // Modified: Check if job already exists based on jobTitle and jobDeadline
            const exists = await enosisbdModel.findOne({ 
                jobTitle: jobDetails[i].jobTitle,       // Modified: checking by jobTitle
                jobDeadline: jobDetails[i].jobDeadline    // Modified: checking by jobDeadline
            });

            if (!exists) {
                await enosisbdModel.create(jobDetails[i]);   // Modified: inserting jobDetails into MongoDB if non-duplicate
                console.log(`Job added to MongoDB: ${jobDetails[i].jobTitle}`); // Modified: log insertion success
            } else {
                console.log(`Duplicate job found, skipping: ${jobDetails[i].jobTitle}`); // Modified: log duplicate job
            }
        } catch (error) {
            console.error("Error saving job details:", error); // Modified: log insertion error
        }
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

    await seliseDetails(page);
    await cefaloDetails(page);
    await enosisbdDetails();

    await browser.close();
    await mongoose.disconnect();

}

trackJobPosts()

