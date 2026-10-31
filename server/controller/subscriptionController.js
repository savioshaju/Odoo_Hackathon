const mongoose = require('mongoose');
const { Subscription } = require('../model/subscriptionModel');
const { User } = require('../model/userModel');

// Predefined available plans catalog
const AVAILABLE_PLANS = [
    {
        planId: 'plan_starter',
        name: 'Starter Cloud',
        tagline: 'Ideal for independent developers and early projects',
        monthlyPrice: 29,
        annualPrice: 24,
        features: [
            'Up to 5 active client projects',
            'Standard automated invoice delivery',
            'Community & email support',
            'REST API access (10k requests/mo)',
            'Standard SLA (99.5% uptime)'
        ],
        popular: false
    },
    {
        planId: 'plan_pro',
        name: 'Professional Scale',
        tagline: 'Full power for growing SaaS companies and businesses',
        monthlyPrice: 79,
        annualPrice: 65,
        features: [
            'Unlimited subscription clients',
            'Automated recurring billing & tax calculation',
            'Priority 24/7 dedicated support',
            'Custom webhooks & integrations',
            'Enterprise SLA (99.99% uptime)',
            'Multi-seat workspace access'
        ],
        popular: true
    },
    {
        planId: 'plan_enterprise',
        name: 'Enterprise Dedicated',
        tagline: 'Custom controls, volume discounts, and compliance',
        monthlyPrice: 199,
        annualPrice: 169,
        features: [
            'Dedicated database partition',
            'Custom payment gateway connectors',
            'SAML / SSO & advanced RBAC audit logs',
            'Dedicated customer success manager',
            'Custom MSA and security compliance reviews'
        ],
        popular: false
    }
];

// 1. Get current authenticated user's subscriptions
async function getUserSubscriptions(req, res, next) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: subscriptions.length,
            subscriptions
        });
    } catch (err) {
        next(err);
    }
}

// 2. Subscribe to a plan
async function createSubscription(req, res, next) {
    try {
        const userId = req.userId;
        const { planId, billingCycle = 'monthly' } = req.body;

        if (!planId) {
            return res.status(400).json({ success: false, message: 'planId is required' });
        }

        const plan = AVAILABLE_PLANS.find(p => p.planId === planId);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Selected plan not found' });
        }

        // Check if user already has an active subscription for this plan
        const existingActive = await Subscription.findOne({
            userId,
            planId,
            status: 'active'
        });

        if (existingActive) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription for this plan'
            });
        }

        const price = billingCycle === 'annual' ? plan.annualPrice * 12 : plan.monthlyPrice;
        const now = new Date();
        const nextBilling = new Date(now);
        if (billingCycle === 'annual') {
            nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        } else {
            nextBilling.setMonth(nextBilling.getMonth() + 1);
        }

        const invoiceId = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        const newSubscription = await Subscription.create({
            userId,
            planName: plan.name,
            planId: plan.planId,
            billingCycle,
            price,
            status: 'active',
            startDate: now,
            nextBillingDate: nextBilling,
            features: plan.features,
            invoices: [
                {
                    invoiceNumber: invoiceId,
                    date: now,
                    amount: price,
                    status: 'Paid',
                    paymentMethod: 'Credit Card (•••• 4242)'
                }
            ]
        });

        return res.status(201).json({
            success: true,
            message: `Successfully subscribed to ${plan.name}`,
            subscription: newSubscription
        });
    } catch (err) {
        next(err);
    }
}

// 3. Cancel user subscription
async function cancelSubscription(req, res, next) {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid subscription ID' });
        }

        // Users can only cancel their own; admins can cancel any
        const query = req.user?.role === 'admin' ? { _id: id } : { _id: id, userId };
        const subscription = await Subscription.findOne(query);

        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        subscription.status = 'canceled';
        await subscription.save();

        return res.status(200).json({
            success: true,
            message: 'Subscription has been canceled',
            subscription
        });
    } catch (err) {
        next(err);
    }
}

// 4. Get available plans catalog
async function getAvailablePlans(req, res, next) {
    try {
        return res.status(200).json({
            success: true,
            plans: AVAILABLE_PLANS
        });
    } catch (err) {
        next(err);
    }
}

// 5. Get user invoices (collected from their subscriptions)
async function getUserInvoices(req, res, next) {
    try {
        const userId = req.userId;
        const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });

        const invoices = [];
        subscriptions.forEach(sub => {
            (sub.invoices || []).forEach(inv => {
                invoices.push({
                    _id: inv._id,
                    invoiceNumber: inv.invoiceNumber,
                    planName: sub.planName,
                    amount: inv.amount,
                    date: inv.date,
                    status: inv.status,
                    paymentMethod: inv.paymentMethod,
                    subscriptionId: sub._id
                });
            });
        });

        // Sort latest invoices first
        invoices.sort((a, b) => new Date(b.date) - new Date(a.date));

        return res.status(200).json({
            success: true,
            count: invoices.length,
            invoices
        });
    } catch (err) {
        next(err);
    }
}

// 6. Admin only: Get all subscriptions across the entire platform
async function getAllSubscriptions(req, res, next) {
    try {
        const subscriptions = await Subscription.find()
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

module.exports = {
    getUserSubscriptions,
    createSubscription,
    cancelSubscription,
    getAvailablePlans,
    getUserInvoices,
    getAllSubscriptions
};
