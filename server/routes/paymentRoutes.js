const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    console.log('Routes: payment');
    next();
});

router.post('/create-checkout-session', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Checkout session created successfully'
    });
});

const paymentRouter = router;
module.exports = { paymentRouter };
