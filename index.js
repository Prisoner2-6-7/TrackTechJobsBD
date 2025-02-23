const express = require('express');
const app = express();
// app.set('view engine', 'ejs');
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies
// app.use(express.static(__dirname + "index"));
const mongoose = require('mongoose');
const { getJobDetailModel, Suggestion } = require('./schemas/jobDetails'); // Import Suggestion model
require('dotenv').config();
const mongoURI = process.env.MONGO_URI;



let companies = [];

app.use(async (req, res, next) => {
    try {
        await mongoose.connect(mongoURI, {})
        // console.error(temp)
        const collections = await mongoose.connection.db.listCollections().toArray();
        companies = collections.map(collection => collection.name.replace('Jobs', ''));

    } catch (err) {
        console.error("Error fetching collection names:", err);
    }
    // console.log(companies);
    next();

}); // Get all the collection names from db and save it as companies[]

app.get("/initializeDBconnection", async (req, res) => {
    mongoose.connect(mongoURI, {})
        .then(() => console.error('connected to db'))
        .catch(err => console.error('couldnt connect to db:', err));
    res.send('ok');
});

// app.get("/test2", async (req, res) => {
//     await mongoose.connect(mongoURI, {})
//     const collections = await mongoose.connection.db.listCollections().toArray();
//     res.send(collections);
// });

app.get("/", async (req, res) => {

    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        // changed line here: use "collection" as the callback parameter instead of "localCompanies"
        let localCompanies = collections.map(collection => collection.name.replace('Jobs', ''));
        
        // changed line here: filter out "suggestions" so it's not processed further
        localCompanies = localCompanies.filter(company => company !== 'suggestions');
        
        const companyDetails = await Promise.all(localCompanies.map(async (company) => {
    
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
    }

    catch (err) {
        mongoose.connect(mongoURI, {})
        // .then(() => console.error('connected to db'))
        // .catch(err => console.error('couldnt connect to db:', err));
        console.error("Error fetching collection names:", err);
        res.status(500).send("Please Refresh the page" + err);
    }
});


app.post("/addCompany", async (req, res) => {
    const newCompany = req.body.companyName.trim().toLowerCase();
    if (newCompany) {
        try {
            await Suggestion.create({ companyName: newCompany });
            console.log(`New suggestion added: ${newCompany}`);
        } catch (error) {
            console.error("Error adding suggestion:", error);
        }
    }
    res.redirect("/");
});


app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000');
});

module.exports = app;