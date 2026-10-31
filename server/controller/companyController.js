const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { Company } = require('../model/companyModel')

const cookieOptions = { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }

function isText(value) {
    return typeof value === 'string' && value.trim() !== ''
}

function isValidPassword(value) {
    return typeof value === 'string' && value.length >= 6
}

function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanEmail(email) {
    return email.trim().toLowerCase()
}

function withoutPassword(company) {
    const { password, ...rest } = company.toObject()
    return rest
}

function isAdmin(req) {
    return req.user?.role === 'admin'
}

// Company Authentication
async function registerCompany(req, res, next) {
    try {
        const { name, email, password, confirmPassword } = req.body

        if (!isText(name) || !isText(email) || !isValidPassword(password)) {
            return res.status(400).json({ message: 'Name, email and a password of at least 6 characters are required' })
        }

        if (confirmPassword !== undefined && confirmPassword !== password) {
            return res.status(400).json({ message: 'Passwords do not match' })
        }

        const companyExist = await Company.findOne({ email: cleanEmail(email) })

        if (companyExist) {
            return res.status(409).json({ message: 'Email already registered' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const company = await Company.create({ name, email, password: hashedPassword })

        res.status(201).json({ message: 'Company registered successfully', company: withoutPassword(company) })
    } catch (err) {
        next(err)
    }
}

async function loginCompany(req, res, next) {
    try {
        const { email, password } = req.body

        if (!isText(email) || !isText(password)) {
            return res.status(400).json({ message: 'Email and password are required' })
        }

        const company = await Company.findOne({ email: cleanEmail(email) })

        if (!company) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        const passwordMatch = await bcrypt.compare(password, company.password)

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        const token = jwt.sign({ id: company.id, role: 'company' }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' })

        res.cookie('token', token, cookieOptions)
        res.status(200).json({ message: 'Login successful', company: withoutPassword(company) })
    } catch (err) {
        next(err)
    }
}


// Company Profile
async function getCompanyProfile(req, res, next) {
    try {
        const company = await Company.findById(req.user.id).select('-password')

        if (!company) {
            return res.status(404).json({ message: 'Company not found' })
        }

        res.status(200).json({ company })
    } catch (err) {
        next(err)
    }
}

async function updateCompanyProfile(req, res, next) {
    try {
        const { name, logo, description, address, socialLink } = req.body

        if (address !== undefined && !isObject(address)) {
            return res.status(400).json({ message: 'Invalid address' })
        }

        const company = await Company.findById(req.user.id)

        if (!company) {
            return res.status(404).json({ message: 'Company not found' })
        }

        if (name !== undefined) company.name = name
        if (logo !== undefined) company.logo = logo
        if (description !== undefined) company.description = description
        if (address !== undefined) company.address = address
        if (socialLink !== undefined) company.socialLink = socialLink

        await company.save()

        res.status(200).json({ message: 'Profile updated', company: withoutPassword(company) })
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid profile data' })
        }

        next(err)
    }
}

async function changeCompanyPassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body

        if (!isText(currentPassword) || !isValidPassword(newPassword)) {
            return res.status(400).json({ message: 'Current password and a new password of at least 6 characters are required' })
        }

        const company = await Company.findById(req.user.id)

        if (!company) {
            return res.status(404).json({ message: 'Company not found' })
        }

        const passwordMatch = await bcrypt.compare(currentPassword, company.password)

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' })
        }

        company.password = await bcrypt.hash(newPassword, 10)
        await company.save()

        res.status(200).json({ message: 'Password changed' })
    } catch (err) {
        next(err)
    }
}

async function deleteCompanyAccount(req, res, next) {
    try {
        const company = await Company.findByIdAndDelete(req.user.id)

        if (!company) {
            return res.status(404).json({ message: 'Company not found' })
        }

        res.clearCookie('token', cookieOptions)
        res.status(200).json({ message: 'Account deleted' })
    } catch (err) {
        next(err)
    }
}


// Admin - Company Management
async function getAllCompanies(req, res, next) {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({ message: 'Admin access required' })
        }

        const companies = await Company.find().select('-password').sort({ createdAt: -1 })

        res.status(200).json({ companies })
    } catch (err) {
        next(err)
    }
}

async function getCompanyById(req, res, next) {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({ message: 'Admin access required' })
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid company id' })
        }

        const company = await Company.findById(req.params.id).select('-password')

        if (!company) {
            return res.status(404).json({ message: 'Company not found' })
        }

        res.status(200).json({ company })
    } catch (err) {
        next(err)
    }
}

async function updateCompanyStatus(req, res, next) {}


// Export Controllers
module.exports = {
    registerCompany,
    loginCompany,
    getCompanyProfile,
    updateCompanyProfile,
    changeCompanyPassword,
    deleteCompanyAccount,
    getAllCompanies,
    getCompanyById,
    updateCompanyStatus
};
