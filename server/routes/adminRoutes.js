const express = require('express')
const { adminSignup, adminLogin, adminLogout, getAdminProfile, updateAdminProfile, deleteAdminAccount, changeAdminPassword, forgotAdminPassword, resetAdminPassword } = require('../controller/adminController')
const router = express.Router() 

router.use((req, res, next) => {
    console.log('Routes: user')
    next()
})

// Authentication
router.post('/signup', adminSignup)
router.post('/login', adminLogin)
router.post('/logout', adminLogout)

// Profile
router.get('/profile', getAdminProfile)
router.put('/profile', updateAdminProfile)
router.delete('/account', deleteAdminAccount)

// Password Management
router.put('/change-password', changeAdminPassword)
router.post('/forgot-password', forgotAdminPassword)
router.post('/reset-password', resetAdminPassword)

// User Management
router.get('/')
router.get('/:id')
router.put('/:id')
router.delete('/:id')

const adminRouter = router
module.exports = { adminRouter }