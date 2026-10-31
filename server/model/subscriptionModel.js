const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        planName: {
            type: String,
            required: true,
            trim: true
        },
        planId: {
            type: String,
            required: true,
            trim: true
        },
        billingCycle: {
            type: String,
            enum: ['monthly', 'annual'],
            default: 'monthly'
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: 'USD'
        },
        status: {
            type: String,
            enum: ['active', 'canceled', 'expired', 'trialing'],
            default: 'active'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        nextBillingDate: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        features: {
            type: [String],
            default: []
        },
        invoices: [
            {
                invoiceNumber: { type: String, required: true },
                date: { type: Date, default: Date.now },
                amount: { type: Number, required: true },
                status: { type: String, enum: ['Paid', 'Pending', 'Refunded'], default: 'Paid' },
                paymentMethod: { type: String, default: 'Credit Card (•••• 4242)' }
            }
        ]
    },
    {
        timestamps: true
    }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = { Subscription };
