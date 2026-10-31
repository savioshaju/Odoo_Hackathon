const mongoose = require('mongoose');

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