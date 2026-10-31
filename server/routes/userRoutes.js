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
const router = express.Router() 

router.use((req, res, next) => {
    console.log('Routes: user')
    next()
})

// Authentication
router.post('/signup', userSignup)
router.post('/verify-otp', verifySignupOTP)
router.post('/resend-otp', resendSignupOTP)
router.post('/login', userLogin)
router.post('/logout', userLogout)

// Profile
router.get('/profile', getUserProfile)
router.put('/profile', updateUserProfile)
router.delete('/account', deleteUserAccount)

// Password Management
router.put('/change-password', changeUserPassword)
router.post('/forgot-password', forgotUserPassword)
router.post('/reset-password', resetUserPassword)

// User Management
// router.get('/')
// router.get('/:id')
// router.put('/:id')
// router.delete('/:id')

const userRouter = router
module.exports = { userRouter }
