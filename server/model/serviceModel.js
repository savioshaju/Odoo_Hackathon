const mongoose = require('mongoose');

const planOptionSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    features: {
        type: [String],
        default: []
    }
});

const serviceSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },

        description: {
            type: String,
            required: true
        },

        features: {
            type: [String],
            default: []
        },

        price : {
            type: String, 
            required: true
        }, 

        duration : {
            type: Number, 
            required: true
        },

        plans: {
            type: [planOptionSchema],
            default: []
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

const Service = mongoose.model("Service", serviceSchema);
module.exports = { Service };
