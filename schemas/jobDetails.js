const mongoose = require('mongoose');

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


module.exports.getJobDetailModel = (company) => {
    let collectionName; // determine collection name based on company
    switch (company) {
        case 'selise': 
            collectionName = 'seliseJobs';
            break;
        case 'ollyo': 
            collectionName = 'ollyoJobs';
            break;
        case 'cefalo':
            collectionName = 'cefaloJobs';
            break;
        case 'enosisbd':
            collectionName = 'enosisbdJobs';
            break;
        default:
            throw new Error(`Unknown company: ${company}`); // changed line here: handle unknown companies
    }
    // changed line here: Use a unique model name per company to prevent OverwriteModelError
    const modelName = `JobDetail_${company}`;
    return mongoose.models[modelName] || mongoose.model(modelName, jobDetailsSchema, collectionName);
}


const suggestionSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        unique: true
    }
});
const Suggestion = mongoose.model('Suggestion', suggestionSchema);
module.exports.Suggestion = Suggestion;