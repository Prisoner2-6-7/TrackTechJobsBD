const mongoose = require('mongoose')

const jobDetailsSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
        required: true
    },
    jobDeadLine: {
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
})

module.export = mongoose.model('JobDetails', jobDetailsSchema)