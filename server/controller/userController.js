const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = require('../model/userModel')

const cookieOptions = { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }

function isText(value) {
    return typeof value === 'string' && value.trim() !== ''
}

function isValidPassword(value) {
    return typeof value === 'string' && value.length >= 6
}

function cleanEmail(email) {
    return email.trim().toLowerCase()
}

function withoutPassword(user) {
    const { password, ...rest } = user.toObject()
    return rest
}

async function userSignup(req, res, next) {
    try {
        const { name, email, password, confirmPassword } = req.body

        if (!isText(name) || !isText(email) || !isValidPassword(password)) {
            return res.status(400).json({ message: 'Name, email and a password of at least 6 characters are required' })
        }

        if (confirmPassword !== undefined && confirmPassword !== password) {
            return res.status(400).json({ message: 'Passwords do not match' })
        }

        const userExist = await User.findOne({ email: cleanEmail(email) })

        if (userExist) {
            return res.status(409).json({ message: 'Email already registered' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({ name, email, password: hashedPassword })

        res.status(201).json({ message: 'Signup successful', user: withoutPassword(user) })
    } catch (err) {
        next(err)
    }
}

async function userLogin(req, res, next) {
    try {
        const { email, password } = req.body

        if (!isText(email) || !isText(password)) {
            return res.status(400).json({ message: 'Email and password are required' })
        }

        const user = await User.findOne({ email: cleanEmail(email) })

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' })
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' })

        res.cookie('token', token, cookieOptions)
        res.status(200).json({ message: 'Login successful', user: withoutPassword(user) })
    } catch (err) {
        next(err)
    }
}

async function userLogout(req, res, next) {
    try {
        res.clearCookie('token', cookieOptions)
        res.status(200).json({ message: 'Logout successful' })
    } catch (err) {
        next(err)
    }
}

async function getUserProfile(req, res, next) {
    try {
        const user = await User.findById(req.user.id).select('-password')

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(200).json({ user })
    } catch (err) {
        next(err)
    }
}

async function updateUserProfile(req, res, next) {
    try {
        const { name, phone } = req.body

        if ((name !== undefined && !isText(name)) || (phone !== undefined && typeof phone !== 'string')) {
            return res.status(400).json({ message: 'Invalid name or phone' })
        }

        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (name !== undefined) user.name = name
        if (phone !== undefined) user.phone = phone

        await user.save()

        res.status(200).json({ message: 'Profile updated', user: withoutPassword(user) })
    } catch (err) {
        next(err)
    }
}

async function deleteUserAccount(req, res, next) {
    try {
        const user = await User.findByIdAndDelete(req.user.id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.clearCookie('token', cookieOptions)
        res.status(200).json({ message: 'Account deleted' })
    } catch (err) {
        next(err)
    }
}

async function changeUserPassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body

        if (!isText(currentPassword) || !isValidPassword(newPassword)) {
            return res.status(400).json({ message: 'Current password and a new password of at least 6 characters are required' })
        }

        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password)

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' })
        }

        user.password = await bcrypt.hash(newPassword, 10)
        await user.save()

        res.status(200).json({ message: 'Password changed' })
    } catch (err) {
        next(err)
    }
}

async function forgotUserPassword(req, res, next) {
    try {
        const { email } = req.body

        if (!isText(email)) {
            return res.status(400).json({ message: 'Email is required' })
        }

        const user = await User.findOne({ email: cleanEmail(email) })

        if (user) {
            const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY + user.password, { expiresIn: '15m' })
            console.log('resetToken :>> ', resetToken)
        }

        res.status(200).json({ message: 'If the email is registered, reset instructions will be sent' })
    } catch (err) {
        next(err)
    }
}

async function resetUserPassword(req, res, next) {
    try {
        const { email, token, newPassword } = req.body

        if (!isText(email) || !isText(token) || !isValidPassword(newPassword)) {
            return res.status(400).json({ message: 'Email, token and a new password of at least 6 characters are required' })
        }

        const user = await User.findOne({ email: cleanEmail(email) })

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' })
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET_KEY + user.password)
        } catch (err) {
            return res.status(400).json({ message: 'Invalid or expired token' })
        }

        user.password = await bcrypt.hash(newPassword, 10)
        await user.save()

        res.status(200).json({ message: 'Password reset successful' })
    } catch (err) {
        next(err)
    }
}

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
