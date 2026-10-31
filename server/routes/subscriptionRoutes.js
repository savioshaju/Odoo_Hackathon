
const express = require('express')

const router = express.Router()

const {
    createSubscription,
    getAllSubscriptions,
    getSubscriptionById,
    getUserSubscriptions,
    getServiceSubscriptions
} = require("../controllers/subscriptionController");


router.use((req, res, next) => {
    console.log("Routes: api")
    next()
})


// Create subscription
router.post("/", createSubscription);

// Get all subscriptions
router.get("/", getAllSubscriptions);

// Get subscription by ID
router.get("/:id", getSubscriptionById);

// Get subscriptions of a particular user
router.get("/user/:userId", getUserSubscriptions);

// Get subscriptions of a particular service
router.get("/service/:serviceId", getServiceSubscriptions);

const subscriptionRouter = router

module.exports = { subscriptionRouter }
