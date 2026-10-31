const express = require('express')
const { createService, getAllServices, getServiceById, getCompanyServices, updateService, updateServiceStatus, deleteService } = require('../controller/serviceController')
const router = express.Router() 

router.use((req, res, next) => {
    console.log('Routes: Service')
    next()
})


router.post("/", createService);

router.get("/", getAllServices);

router.get("/:id", getServiceById);

router.get("/company/:companyId", getCompanyServices);

router.put("/:id", updateService);

router.patch("/:id/status", updateServiceStatus);

router.delete("/:id", deleteService);


const serviceRouter = router
module.exports = { serviceRouter }