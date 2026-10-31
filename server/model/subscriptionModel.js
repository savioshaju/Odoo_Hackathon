const mongoose = require("mongoose");

const subscriptionSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    amountPaid: {
        type: Number,
        required: true,
        min: 0
    }

}, { timestamps: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = { Subscription }