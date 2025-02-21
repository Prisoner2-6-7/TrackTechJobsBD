//// filepath: /home/parrot/ProgPrac/TrackTechJobsBD/schemas/jobDetails.js
const mongoose = require('mongoose')

const jobDetailsSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
        required: true
    },
    jobDeadline: {                  
        type: String,
        required: true
    },
    jobURL: {
        type: String,
        required: true
    },
    jobLocation: {
        type: String,
        required: false
    },
});



// This given by AI no clue about whats doing here

module.exports.getJobDetailModel = (company) => {
    let collectionName; // Modified: determine collection name based on company
    switch (company) {
        case 'selise': 
            collectionName = 'seliseJobs'
            break;
        case 'ollyo': 
            collectionName = 'ollyoJobs'
            break;
        case 'cefalo':
            collectionName = 'cefaloJobs'
            break;
        case 'enosisbd':
            collectionName = 'enosisbdJobs'
            break
        default:
            collectionName = 'defaultJobs'
    }
    // Modified: Use a unique model name per company to prevent OverwriteModelError
    const modelName = `JobDetail_${company}`;
    return mongoose.models[modelName] || mongoose.model(modelName, jobDetailsSchema, collectionName)
}