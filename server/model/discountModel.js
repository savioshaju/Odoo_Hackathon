const mongoose = require('mongoose');

const discountSchema = mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'percentage'
        },
        value: {
            type: Number,
            required: true,
            min: 0
        },
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service',
            default: null
        },
        description: {
            type: String,
            default: ''
        },
        isActive: {
            type: Boolean,
            default: true
        },
        expiresAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Discount = mongoose.model('Discount', discountSchema);
module.exports = { Discount };

