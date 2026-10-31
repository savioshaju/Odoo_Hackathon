const express = require('express');

const { userRouter } = require('./userRoutes');
const { companyRouter } = require('./companyRoutes');
const { adminRouter } = require('./adminRoutes');
const { paymentRouter } = require('./paymentRoutes');
const { serviceRouter } = require('./serviceRoutes');
const { subscriptionRouter } = require('./subscriptionRoutes');

const router = express.Router();

router.use((req, res, next) => {
    console.log("Routes: api");
    next();
});

router.use('/users', userRouter);
router.use('/admin', adminRouter);
router.use('/company', companyRouter);
router.use('/service', serviceRouter);
router.use('/services', serviceRouter);
router.use('/subscriptions', subscriptionRouter);
router.use('/payment', paymentRouter);

const apiRouter = router;
module.exports = { apiRouter };
