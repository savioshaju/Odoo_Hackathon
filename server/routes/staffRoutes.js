const express = require('express')
const { 
    staffLogin, 
    registerStaff, 
    staffLogout, 
    getStaffProfile, 
    updateStaffProfile, 
    getAllStaff 
} = require('../controller/staffController')
const { requireRole } = require('../middleware/roleAuth')

const router = express.Router() 

router.use((req, res, next) => {
    console.log('Routes: staff')
    next()
})

// Public Staff Auth
router.post('/login', staffLogin)
router.post('/logout', staffLogout)

// Admin-managed Staff Onboarding
router.post('/register', requireRole(['admin']), registerStaff)
router.get('/', requireRole(['admin']), getAllStaff)

// Staff Profile (Protected: staff or admin)
router.get('/profile', requireRole(['staff', 'admin']), getStaffProfile)
router.put('/profile', requireRole(['staff', 'admin']), updateStaffProfile)

const staffRouter = router
module.exports = { staffRouter }
