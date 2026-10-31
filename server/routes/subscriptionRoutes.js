const express = require('express');
const router = express.Router();

const {
    createSubscription,
    getAllSubscriptions,
    getSubscriptionById,
    getUserSubscriptions,
    getServiceSubscriptions,
    cancelSubscription
} = require("../controller/subscriptionController");
const { userAuth } = require('../middleware/userAuth');

router.use((req, res, next) => {
    console.log("Routes: api");
    next();
});

// Create subscription
router.post("/", createSubscription);

// Get all subscriptions
router.get("/", getAllSubscriptions);

// Cancel subscription
router.patch("/:id/cancel", cancelSubscription);
router.post("/cancel/:id", cancelSubscription);

// Get subscriptions of currently authenticated user
router.get("/my", userAuth, getUserSubscriptions);

// Get subscriptions of a particular user
router.get("/user/:userId", getUserSubscriptions);

// Get subscriptions of a particular service
router.get("/service/:serviceId", getServiceSubscriptions);

// Get subscription by ID
router.get("/:id", getSubscriptionById);

const subscriptionRouter = router;
module.exports = { subscriptionRouter };
