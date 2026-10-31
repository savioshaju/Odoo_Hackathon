const express = require('express')
const router = express.Router() 

router.use((req, res, next) => {
    console.log('Routes: user')
    next()
})

// Authentication
router.post('/signup')
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

const userRouter = router
module.exports = { userRouter }