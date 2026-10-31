async function userSignup(req, res, next) { }

async function userLogin(req, res, next) { }

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
