const express = require('express')
const { registerCompany, loginCompany, getCompanyProfile, updateCompanyProfile, changeCompanyPassword, deleteCompanyAccount } = require('../controller/companyController')

const router = express.Router()

router.use((req, res, next) => {
    console.log('Routes: Company')
    next()
})

// Public routes
router.post('/register', registerCompany)
router.post('/login', loginCompany)

// Company routes
router.get('/profile', getCompanyProfile)
router.put('/profile', updateCompanyProfile)
router.patch('/change-password', changeCompanyPassword)
router.delete('/account', deleteCompanyAccount)

// Admin routes
router.get('/')
router.get('/:id')
router.patch('/:id/status')

const companyRouter = router
module.exports = { companyRouter }