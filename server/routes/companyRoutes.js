const express = require('express')
const { registerCompany, loginCompany, getCompanyProfile, updateCompanyProfile, changeCompanyPassword, deleteCompanyAccount } = require('../controller/companyController')

const router = express.Router()

router.use((req, res, next) => {
    console.log('Routes: Company')
    next()
})

const notImplemented = (req, res) => res.status(501).json({ message: 'Not implemented yet' });

// Public routes
<<<<<<< HEAD
router.post('/register', registerCompany)
router.post('/login', loginCompany)

// Company routes
router.get('/profile', getCompanyProfile)
router.put('/profile', updateCompanyProfile)
router.patch('/change-password', changeCompanyPassword)
router.delete('/account', deleteCompanyAccount)
=======
router.post('/register', notImplemented)
router.post('/login', notImplemented)

// Company routes
router.get('/profile', notImplemented)
router.put('/profile', notImplemented)
router.patch('/change-password', notImplemented)
router.delete('/account', notImplemented)
>>>>>>> d4a57908efb150784aa9e588587e572dd6c90174

// Admin routes
router.get('/', notImplemented)
router.get('/:id', notImplemented)
router.patch('/:id/status', notImplemented)

const companyRouter = router
module.exports = { companyRouter }
