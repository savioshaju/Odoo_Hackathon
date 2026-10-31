const express = require('express')
const router = express.Router()

router.use((req, res, next) => {
    console.log('Routes: payment')
    next()
})

router.post('/create-checkout-session')

const paymentRouter = router
module.exports = { paymentRouter }