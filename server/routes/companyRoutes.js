const express = require('express')

const router = express.Router()

router.use((req, res, next) => {
    console.log('Routes: Company')
    next()
})

// Public routes
router.post('/register')
router.post('/login')

// Company routes
router.get('/profile')
router.put('/profile')
router.patch('/change-password')
router.delete('/account')

// Admin routes
router.get('/')
router.get('/:id')
router.patch('/:id/status')

const companyRouter = router
module.exports = { companyRouter }