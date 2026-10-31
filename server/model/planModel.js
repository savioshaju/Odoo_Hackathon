const mongoose = require('mongoose');

const planSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        planCode: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        tagline: {
            type: String,
            default: ''
        },
        monthlyPrice: {
            type: Number,
            required: true,
            min: 0
        },
        annualPrice: {
            type: Number,
            required: true,
            min: 0
        },
        features: {
            type: [String],
            default: []
        },
        popular: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Plan = mongoose.model('Plan', planSchema);
module.exports = { Plan };

