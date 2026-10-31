
const express = require('express')

const { userRouter } = require('./userRoutes')
// const { adminRouter } = require('./adminRoutes')
// const { staffRouter } = require('./staffRoutes')

const router = express.Router()

router.use((req, res, next) => {
    console.log("Routes: api")
    next()
})

router.use('/users', userRouter)
// router.use('/admin', adminRouter)
// router.use('/staff', staffRouter)
// router.use('/subscriptions')
// router.use('/payment')

const apiRouter = router

module.exports = { apiRouter }
