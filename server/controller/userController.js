const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../model/userModel');

// Strict email regex: requires valid local part, domain, and TLD of at least 2 characters
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Simple 10-digit phone number regex
const PHONE_REGEX = /^\d{10}$/;

function validatePassword(password) {
    if (!password || password.length < 8) {
        return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
        return 'Password must contain at least one special character (!@#$%^&*...)';
    }
    return null;
}

async function userSignup(req, res, next) {
    try {
        const { name, email, phone, password, confirmPassword } = req.body;

        // Name validation
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Full name is required' });
        }
        if (name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Name must be at least 2 characters long' });
        }

        // Email validation
        if (!email || !EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        // Phone validation (10 digits)
        const cleanedPhone = phone ? phone.toString().trim().replace(/\D/g, '') : '';
        if (!cleanedPhone || !PHONE_REGEX.test(cleanedPhone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number must be exactly 10 digits' 
            });
        }

        // Password complexity validation
        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ success: false, message: passwordError });
        }

        // Confirm password matching
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check if email already exists
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'An account with this email address already exists' 
            });
        }

        // 2. Check if phone number already exists
        const existingPhone = await User.findOne({ phone: cleanedPhone });
        if (existingPhone) {
            return res.status(400).json({ 
                success: false, 
                message: 'An account with this phone number already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save new user
        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            phone: cleanedPhone,
            password: hashedPassword,
            role: 'user',
        });

        // Generate token
        const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'default_jwt_secret';
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role },
            secretKey,
            { expiresIn: '7d' }
        );

        // Set httpOnly cookie if supported
        if (typeof res.cookie === 'function') {
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
        }

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
            },
        });
    } catch (error) {
        // Catch MongoDB duplicate key error (code 11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'field';
            return res.status(400).json({
                success: false,
                message: `An account with this ${field === 'phone' ? 'phone number' : 'email address'} already exists`,
            });
        }
        console.error('Error in userSignup:', error);
        return res.status(500).json({ success: false, message: 'Server error during signup', error: error.message });
    }
}

async function userLogin(req, res, next) {
    try {
        const { identifier, email, phone, password } = req.body;

        // Support login with either email or phone, or general identifier
        const loginValue = (identifier || email || phone || '').toString().trim();

        if (!loginValue) {
            return res.status(400).json({ success: false, message: 'Email or phone number is required' });
        }
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        // Find user by email or phone
        const user = await User.findOne({
            $or: [
                { email: loginValue.toLowerCase() },
                { phone: loginValue.replace(/\D/g, '') },
            ],
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. User not found' });
        }

        if (user.isActive === false) {
            return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact support' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Generate JWT token
        const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'default_jwt_secret';
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            secretKey,
            { expiresIn: '7d' }
        );

        // Set httpOnly cookie if supported
        if (typeof res.cookie === 'function') {
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error in userLogin:', error);
        return res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
}
async function userLogout(req, res, next) { }
async function getUserProfile(req, res, next) { }
async function updateUserProfile(req, res, next) { }
async function deleteUserAccount(req, res, next) { }
async function changeUserPassword(req, res, next) { }
async function forgotUserPassword(req, res, next) { }
async function resetUserPassword(req, res, next) { }

module.exports = {
    userSignup,
    userLogin,
    userLogout,
    getUserProfile,
    updateUserProfile,
    deleteUserAccount,
    changeUserPassword,
    forgotUserPassword, 
    resetUserPassword
};
