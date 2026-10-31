const express = require('express')
const router = express.Router() 

router.use((req, res, next) => {
    console.log('Routes: user')
    next()
})

// Authentication
router.post('/register')
router.post('/login')
router.post('/logout')

// Profile
router.get('/profile')
router.put('/profile')
router.delete('/account')

// Password Management
router.put('/change-password')
router.post('/forgot-password')
router.post('/reset-password')

// User Management
router.get('/')
router.get('/:id')
router.put('/:id')
router.delete('/:id')

const adminRouter = router
module.exports = { adminRouter }