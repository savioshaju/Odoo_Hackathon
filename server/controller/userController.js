const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../model/userModel');
const { sendOTPEmail } = require('../config/mailer');

const cookieOptions = { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 };

// Strict email regex: requires valid local part, domain, and TLD of at least 2 characters
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Simple 10-digit phone number regex
const PHONE_REGEX = /^\d{10}$/;

// In-memory OTP storage (no database storage)
// Format: email -> { otp: string, userData: object, expiresAt: number }
const otpStore = new Map();

function isText(value) {
    return typeof value === 'string' && value.trim() !== '';
}

function isValidPassword(value) {
    return typeof value === 'string' && value.length >= 6;
}

function cleanEmail(email) {
    return email.trim().toLowerCase();
}

function withoutPassword(user) {
    const { password, ...rest } = user.toObject();
    return rest;
}

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

// 1. Initial Signup: Validates info, saves in memory (not in DB), and sends OTP email
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

        // Check if email already exists in MongoDB
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'An account with this email address already exists. Please log in.' 
            });
        }

        // Check if phone number already exists in MongoDB
        const existingPhone = await User.findOne({ phone: cleanedPhone });
        if (existingPhone) {
            return res.status(400).json({ 
                success: false, 
                message: 'An account with this phone number already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit numeric OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        // Save OTP and temporary data in memory (NOT in database)
        otpStore.set(normalizedEmail, {
            otp: otpCode,
            userData: {
                name: name.trim(),
                email: normalizedEmail,
                phone: cleanedPhone,
                password: hashedPassword,
            },
            expiresAt,
        });

        // Send OTP via nodemailer
        await sendOTPEmail(normalizedEmail, otpCode);

        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email address. Please verify to complete registration.',
            email: normalizedEmail,
        });
    } catch (error) {
        console.error('Error in userSignup:', error);
        return res.status(500).json({ success: false, message: 'Server error during signup', error: error.message });
    }
}

// 2. Verify OTP & Finalize Registration (Creates user in DB only upon valid OTP)
async function verifySignupOTP(req, res, next) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const record = otpStore.get(normalizedEmail);

        if (!record) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP expired or not found. Please request a new one.' 
            });
        }

        if (record.otp !== otp.toString().trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP. Please check your code and try again.' 
            });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(normalizedEmail);
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new code.' 
            });
        }

        const { userData } = record;

        // Double check uniqueness in database before creating
        const existing = await User.findOne({
            $or: [{ email: userData.email }, { phone: userData.phone }],
        });
        if (existing) {
            otpStore.delete(normalizedEmail);
            return res.status(400).json({ 
                success: false, 
                message: 'An account with this email or phone number already exists' 
            });
        }

        // Create the actual user in database now that OTP is verified
        const newUser = await User.create({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
            role: 'user',
        });

        // Remove from memory
        otpStore.delete(normalizedEmail);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully! You can now log in.',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error('Error in verifySignupOTP:', error);
        return res.status(500).json({ success: false, message: 'Server error verifying OTP', error: error.message });
    }
}

// 3. Resend OTP
async function resendSignupOTP(req, res, next) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const record = otpStore.get(normalizedEmail);

        if (!record) {
            return res.status(400).json({ 
                success: false, 
                message: 'Registration session expired. Please fill out the registration form again.' 
            });
        }

        // Generate new OTP
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        record.otp = newOtp;
        record.expiresAt = Date.now() + 10 * 60 * 1000;
        otpStore.set(normalizedEmail, record);

        await sendOTPEmail(normalizedEmail, newOtp);

        return res.status(200).json({
            success: true,
            message: 'A new verification OTP has been sent to your email',
        });
    } catch (error) {
        console.error('Error in resendSignupOTP:', error);
        return res.status(500).json({ success: false, message: 'Server error resending OTP', error: error.message });
    }
}

async function userLogin(req, res, next) {
    try {
        const { identifier, email, phone, password } = req.body;

        const loginValue = (identifier || email || phone || '').toString().trim();

        if (!loginValue) {
            return res.status(400).json({ success: false, message: 'Email or phone number is required' });
        }
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        const user = await User.findOne({
            $or: [
                { email: loginValue.toLowerCase() },
                { phone: loginValue },
            ],
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact support' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'default_jwt_secret';
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            secretKey,
            { expiresIn: '7d' }
        );

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

async function userLogout(req, res, next) {
    try {
        res.clearCookie('token', cookieOptions);
        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        next(err);
    }
}

async function getUserProfile(req, res, next) {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
}

async function updateUserProfile(req, res, next) {
    try {
        const { name, phone } = req.body;
        if ((name !== undefined && !isText(name)) || (phone !== undefined && typeof phone !== 'string')) {
            return res.status(400).json({ message: 'Invalid name or phone' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;

        await user.save();
        res.status(200).json({ message: 'Profile updated', user: withoutPassword(user) });
    } catch (err) {
        next(err);
    }
}

async function deleteUserAccount(req, res, next) {
    try {
        const user = await User.findByIdAndDelete(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.clearCookie('token', cookieOptions);
        res.status(200).json({ message: 'Account deleted' });
    } catch (err) {
        next(err);
    }
}

async function changeUserPassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!isText(currentPassword) || !isValidPassword(newPassword)) {
            return res.status(400).json({ message: 'Current password and a new password of at least 6 characters are required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Password changed' });
    } catch (err) {
        next(err);
    }
}

async function forgotUserPassword(req, res, next) {
    try {
        const { email } = req.body;
        if (!isText(email)) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email: cleanEmail(email) });
        if (user) {
            const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY + user.password, { expiresIn: '15m' });
            console.log('resetToken :>> ', resetToken);
        }

        res.status(200).json({ message: 'If the email is registered, reset instructions will be sent' });
    } catch (err) {
        next(err);
    }
}

async function resetUserPassword(req, res, next) {
    try {
        const { email, token, newPassword } = req.body;
        if (!isText(email) || !isText(token) || !isValidPassword(newPassword)) {
            return res.status(400).json({ message: 'Email, token and a new password of at least 6 characters are required' });
        }

        const user = await User.findOne({ email: cleanEmail(email) });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET_KEY + user.password);
        } catch (err) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    userSignup,
    verifySignupOTP,
    resendSignupOTP,
    userLogin,
    userLogout,
    getUserProfile,
    updateUserProfile,
    deleteUserAccount,
    changeUserPassword,
    forgotUserPassword,
    resetUserPassword
};
