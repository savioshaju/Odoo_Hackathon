const mongoose = require('mongoose');
const { Subscription } = require('../model/subscriptionModel');
const { Service } = require('../model/serviceModel');
const { User } = require('../model/userModel');

// 1. Create subscription
async function createSubscription(req, res, next) {
    try {
        const userId = req.userId || req.user?.id || req.body?.userId;
        const { serviceId, startDate, durationInDays, amountPaid } = req.body || {};

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        if (!serviceId) {
            return res.status(400).json({ success: false, message: 'Service ID is required' });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ success: false, message: 'Invalid service ID format' });
        }

        if (!(await User.exists({ _id: userId }))) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found in database' });
        }
        if (!service.isActive) {
            return res.status(400).json({ success: false, message: 'Service is not active' });
        }

        const effectiveStartDate = startDate ? new Date(startDate) : new Date();
        if (Number.isNaN(effectiveStartDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid start date' });
        }

        const duration = Number(durationInDays) || Number(service.duration) || 30;
        if (!Number.isInteger(duration) || duration <= 0) {
            return res.status(400).json({ success: false, message: 'Duration must be a positive whole number of days' });
        }
        const effectiveEndDate = new Date(effectiveStartDate);
        effectiveEndDate.setDate(effectiveEndDate.getDate() + duration);

        const priceNumber = Number(amountPaid) || parseFloat(service.price);
        if (Number.isNaN(priceNumber) || priceNumber < 0) {
            return res.status(400).json({ success: false, message: 'A valid amount is required' });
        }

        const newSubscription = await Subscription.create({
            userId,
            serviceId,
            startDate: effectiveStartDate,
            endDate: effectiveEndDate,
            amountPaid: priceNumber,
            status: 'active'
        });

        const populated = await Subscription.findById(newSubscription._id)
            .populate('serviceId')
            .populate('userId', 'name email phone');

        return res.status(201).json({
            success: true,
            message: `Successfully subscribed to ${service.name}`,
            subscription: populated
        });
    } catch (err) {
        next(err);
    }
}

// 2. Get all subscriptions across the platform
async function getAllSubscriptions(req, res, next) {
    try {
        const subscriptions = await Subscription.find()
            .populate('userId', 'name email phone')
            .populate('serviceId')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: subscriptions.length,
            subscriptions
        });
    } catch (err) {
        next(err);
    }
}

// 3. Get subscription by ID
async function getSubscriptionById(req, res, next) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid subscription ID' });
        }

        const subscription = await Subscription.findById(id)
            .populate('userId', 'name email phone')
            .populate('serviceId');

        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        return res.status(200).json({
            success: true,
            subscription
        });
    } catch (err) {
        next(err);
    }
}

// 4. Get subscriptions of a particular user
async function getUserSubscriptions(req, res, next) {
    try {
        const userId = req.params.userId || req.userId || req.user?.id;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const subscriptions = await Subscription.find({ userId })
            .populate('serviceId')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: subscriptions.length,
            subscriptions
        });
    } catch (err) {
        next(err);
    }
}

// 5. Get subscriptions of a particular service
async function getServiceSubscriptions(req, res, next) {
    try {
        const { serviceId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ success: false, message: 'Invalid service ID' });
        }

        const subscriptions = await Subscription.find({ serviceId })
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: subscriptions.length,
            subscriptions
        });
    } catch (err) {
        next(err);
    }
}

// 6. Cancel or update subscription status
async function cancelSubscription(req, res, next) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid subscription ID' });
        }

        const subscription = await Subscription.findById(id);

        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        if (subscription.status !== 'active') {
            return res.status(409).json({ success: false, message: `Subscription is already ${subscription.status}` });
        }

        subscription.status = 'canceled';
        await subscription.save();
        await subscription.populate('serviceId');

        return res.status(200).json({
            success: true,
            message: 'Subscription canceled successfully',
            subscription
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createSubscription,
    getAllSubscriptions,
    getSubscriptionById,
    getUserSubscriptions,
    getServiceSubscriptions,
    cancelSubscription
};
