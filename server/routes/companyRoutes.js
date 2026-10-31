const express = require('express')

const router = express.Router()

router.use((req, res, next) => {
    console.log('Routes: Company')
    next()
})

const notImplemented = (req, res) => res.status(501).json({ message: 'Not implemented yet' });

// Public routes
router.post('/register', notImplemented)
router.post('/login', notImplemented)

// Company routes
router.get('/profile', notImplemented)
router.put('/profile', notImplemented)
router.patch('/change-password', notImplemented)
router.delete('/account', notImplemented)

// Admin routes
router.get('/', notImplemented)
router.get('/:id', notImplemented)
router.patch('/:id/status', notImplemented)

const companyRouter = router
module.exports = { companyRouter }
