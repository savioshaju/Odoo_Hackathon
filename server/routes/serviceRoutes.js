const express = require('express')
const { 
    createService, 
    getAllServices, 
    getServiceById, 
    getCompanyServices, 
    updateService, 
    updateServiceStatus, 
    deleteService 
} = require('../controller/serviceController')
const { requireRole } = require('../middleware/roleAuth')

const router = express.Router() 

router.use((req, res, next) => {
    console.log('Routes: Service')
    next()
})

// Read services: Authenticated users, staff, or admin
router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.get("/company/:companyId", getCompanyServices);

// Mutating service routes (Create, Update, Delete, Status change): Staff or Admin only
router.post("/", requireRole(['admin', 'staff']), createService);
router.put("/:id", requireRole(['admin', 'staff']), updateService);
router.patch("/:id/status", requireRole(['admin', 'staff']), updateServiceStatus);
router.delete("/:id", requireRole(['admin']), deleteService);

const serviceRouter = router
module.exports = { serviceRouter }
