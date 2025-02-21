const express = require('express');
const app = express();
app.set('view engine', 'ejs');

const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const { getJobDetailModel } = require('./schemas/jobDetails');
require('dotenv').config();
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {})
    .then(() => console.log('connected to db'))
    .catch(err => console.log('couldnt connect to db:', err));

let companies = [];

app.use(async (req, res, next) => {
    const collections = await mongoose.connection.db.listCollections().toArray();
    companies = collections.map(collection => collection.name.replace('Jobs', ''));
    next();
}); // Get all the collection names from db and save it as companies[]

app.get("/", async (req, res) => {
    const companyDetails = await Promise.all(companies.map(async (company) => {
        try {
            const JobDetail = getJobDetailModel(company);
            const jobs = await JobDetail.find({});
            return { company, jobs };
        } catch (error) {
            console.error("Error fetching job details:", error);
            return { company, jobs: [] };
        }
    }));
    res.render("index", { companyDetails });
});

// app.get("/all", async (req, res) => {
//     try {
//         const jobsArray = await Promise.all(companies.map(async (company) => {
//             const JobDetail = getJobDetailModel(company);
//             return await JobDetail.find({});
//         }));

//         const allJobs = jobsArray.flat();

//         res.json(allJobs);
//     } catch (error) {
//         console.error("Error fetching job details:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// app.get("/:company", async (req, res) => {
//     try {
//         const JobDetail = getJobDetailModel(req.params.company);
//         const jobs = await JobDetail.find({});
//         res.json(jobs);
//     } catch (error) {
//         console.error("Error fetching job details:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

app.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000');
});