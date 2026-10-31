
const express = require('express')

const router = express.Router()

router.use((req, res, next) => {
    console.log("Routes: api")
    next()
})




const subscriptionRouter = router

module.exports = { subscriptionRouter }
