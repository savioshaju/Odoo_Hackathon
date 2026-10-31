
const express = require('express')

const { userRouter } = require('./userRoutes')
const { companyRouter } = require('./companyRoutes')
// const { adminRouter } = require('./adminRoutes')
// const { staffRouter } = require('./staffRoutes')

const router = express.Router()

router.use((req, res, next) => {
    console.log("Routes: api")
    next()
})

router.use('/users', userRouter)
router.use('/company', companyRouter)
// router.use('/admin', adminRouter)
// router.use('/staff', staffRouter)
// router.use('/subscriptions')
// router.use('/payment')

const apiRouter = router

module.exports = { apiRouter }
