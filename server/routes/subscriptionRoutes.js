const express = require('express');
const {
    getUserSubscriptions,
    createSubscription,
    cancelSubscription,
    getAvailablePlans,
    getUserInvoices,
    getAllSubscriptions
} = require('../controller/subscriptionController');
const { userAuth } = require('../middleware/userAuth');
const { requireRole } = require('../middleware/roleAuth');

const router = express.Router();

router.use((req, res, next) => {
    console.log('Routes: subscriptions');
    next();
});

// Public / Authenticated catalog of plans
router.get('/plans', getAvailablePlans);

// Protected User Routes (authenticated strictly using userAuth)
router.get('/my', userAuth, getUserSubscriptions);
router.post('/subscribe', userAuth, createSubscription);
router.patch('/:id/cancel', userAuth, cancelSubscription);
router.get('/invoices', userAuth, getUserInvoices);

// Admin-Only Route
router.get('/all', requireRole('admin'), getAllSubscriptions);

const subscriptionRouter = router;
module.exports = { subscriptionRouter };
