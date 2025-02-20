const puppeteer = require("puppeteer"); // changed line here: using CommonJS syntax

const requestHeaders = {
    'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    Referer: 'https://www.google.com/', };

async function trackJobPosts() {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox"],
        defaultViewport:null
    });

    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 });
    
    // Scraping from selisegroup.com
    await page.setExtraHTTPHeaders({ ...requestHeaders });
    await page.goto('https://selisegroup.com/join-the-team/', { waitUntil: 'networkidle2', timeout:0});

    const jobURL = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.job_list_item a')).map(link => link.href)});

    if (jobURL) {
        for (let i = 0; i < jobURL.length; i++) {
            await page.goto(jobURL[i], { waitUntil: 'networkidle2', timeout:0});
            // Extracting job details
            const jobDetails = await page.evaluate(() => {
                const jobDetails = document.querySelector('.single-job-title').innerText;
                const [jobTitle, jobDeadLine] = jobDetails.split('\n').filter(line=>line.trim());
                return { jobTitle, jobDeadLine };
            });

            console.log(jobDetails);
            await page.goto('https://selisegroup.com/join-the-team/', { waitUntil: 'networkidle2', timeout:0});
        }

    }  else {
        console.log('class not Found')
    }

    // console.log(jobLinks)   

    await browser.close();
}

trackJobPosts()