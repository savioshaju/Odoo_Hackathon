const express = require('express');
const router = express.Router();

const { adminAuth } = require('../middleware/adminAuth');
const {
    adminSignup,
    adminLogin,
    adminLogout,
    getAdminProfile,
    updateAdminProfile,
    deleteAdminAccount,
    changeAdminPassword,
    forgotAdminPassword,
    resetAdminPassword,
    getAdminOverview,
    getAllUsers,
    updateUserRole,
    toggleUserStatus
} = require('../controller/adminController');

router.use((req, res, next) => {
    console.log('Routes: Admin');
    next();
});

// Authentication
router.post('/signup', adminSignup);
router.post('/login', adminLogin);
router.post('/logout', adminLogout);

// Profile
router.get('/profile', adminAuth, getAdminProfile);
router.put('/profile', adminAuth, updateAdminProfile);
router.delete('/account', adminAuth, deleteAdminAccount);

// Password Management
router.put('/change-password', adminAuth, changeAdminPassword);
router.post('/forgot-password', forgotAdminPassword);
router.post('/reset-password', resetAdminPassword);

// Admin Overview
router.get('/overview', adminAuth, getAdminOverview);

// User Management
router.get('/users', adminAuth, getAllUsers);
router.put('/users/:id/role', adminAuth, updateUserRole);
router.put('/users/:id/status', adminAuth, toggleUserStatus);

const adminRouter = router;
module.exports = { adminRouter };
