const { User } = require("../model/userModel")


async function adminSignup(req, res, next) { }

async function adminLogin(req, res, next) { }

async function adminLogout(req, res, next) { }

async function getAdminProfile(req, res, next) { }

async function updateAdminProfile(req, res, next) { }

async function deleteAdminAccount(req, res, next) { }

async function changeAdminPassword(req, res, next) { }

async function forgotAdminPassword(req, res, next) { }

async function resetAdminPassword(req, res, next) { }

module.exports = {
    adminSignup, 
    adminLogin, 
    adminLogout, 
    getAdminProfile, 
    updateAdminProfile, 
    deleteAdminAccount, 
    changeAdminPassword, 
    changeAdminPassword, 
    forgotAdminPassword, 
    resetAdminPassword
}