const express = require('express');

const { userRouter } = require('./userRoutes');
const { companyRouter } = require('./companyRoutes');
const { subscriptionRouter } = require('./subscriptionRoutes');
const { serviceRouter } = require('./serviceRoutes');

const router = express.Router();

router.use((req, res, next) => {
    console.log("Routes: api");
    next();
});

// Mounted API routes
router.use('/users', userRouter);
router.use('/company', companyRouter);
router.use('/subscriptions', subscriptionRouter);
router.use('/services', serviceRouter);

const apiRouter = router;
module.exports = { apiRouter };
