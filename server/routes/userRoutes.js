const express = require('express')
const { 
    userSignup, 
    verifySignupOTP, 
    resendSignupOTP, 
    userLogin, 
    userLogout, 
    getUserProfile, 
    updateUserProfile, 
    deleteUserAccount, 
    changeUserPassword, 
    forgotUserPassword, 
    resetUserPassword 
} = require('../controller/userController')
const { userAuth } = require('../middleware/userAuth')

const router = express.Router() 

router.use((req, res, next) => {
    console.log('Routes: user')
    next()
})

// Authentication (Public)
router.post('/signup', userSignup)
router.post('/verify-otp', verifySignupOTP)
router.post('/resend-otp', resendSignupOTP)
router.post('/login', userLogin)
router.post('/logout', userLogout)

// Password Recovery with OTP (Public)
router.post('/forgot-password', forgotUserPassword)
router.post('/reset-password', resetUserPassword)

// Protected User Routes (Require userAuth)
router.get('/profile', userAuth, getUserProfile)
router.put('/profile', userAuth, updateUserProfile)
router.delete('/account', userAuth, deleteUserAccount)
router.put('/change-password', userAuth, changeUserPassword)

const userRouter = router
module.exports = { userRouter }
