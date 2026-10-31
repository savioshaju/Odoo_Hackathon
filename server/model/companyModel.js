const mongoose = require('mongoose')

const companySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    logo: {
        type: String,
        default: ""
    },

    description: {
        type: String,
        default: ""
    },

    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
    },

    socialLink: [{
        platform: {
            type: String
        },
        url: {
            type: String
        }
    }]

}, {
    timestamps: true
})

const Company = mongoose.model('Company', companySchema)
module.exports = { Company }