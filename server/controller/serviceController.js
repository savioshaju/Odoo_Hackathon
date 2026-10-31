const mongoose = require('mongoose');
const { Service } = require('../model/serviceModel');
const { Company } = require('../model/companyModel');

// POST / - Create a new service
async function createService(req, res, next) {
    try {
        const { name, companyId, description, features, isActive } = req.body;

        if (!name || !companyId || !description) {
            return res.status(400).json({
                success: false,
                message: 'Name, companyId, and description are required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid companyId format'
            });
        }

        const companyExists = await Company.findById(companyId);
        if (!companyExists) {
            return res.status(404).json({
                success: false,
                message: 'Company not found with the provided companyId'
            });
        }

        const newService = await Service.create({
            name: name.trim(),
            companyId,
            description: description.trim(),
            features: Array.isArray(features) ? features : [],
            isActive: isActive !== undefined ? Boolean(isActive) : true
        });

        return res.status(201).json({
            success: true,
            message: 'Service created successfully',
            service: newService
        });
    } catch (err) {
        next(err);
    }
}

// GET / - Get all services with optional filters
async function getAllServices(req, res, next) {
    try {
        const { companyId, isActive, search } = req.query;
        const filter = {};

        if (companyId) {
            if (!mongoose.Types.ObjectId.isValid(companyId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid companyId format'
                });
            }
            filter.companyId = companyId;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true' || isActive === true;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const services = await Service.find(filter)
            .populate('companyId', 'name email logo description')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: services.length,
            services
        });
    } catch (err) {
        next(err);
    }
}

// GET /:id - Get single service by ID
async function getServiceById(req, res, next) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID format'
            });
        }

        const service = await Service.findById(id).populate('companyId', 'name email logo description address');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        return res.status(200).json({
            success: true,
            service
        });
    } catch (err) {
        next(err);
    }
}

// GET /company/:companyId - Get all services for a specific company
async function getCompanyServices(req, res, next) {
    try {
        const { companyId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid companyId format'
            });
        }

        const services = await Service.find({ companyId })
            .populate('companyId', 'name email logo')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: services.length,
            services
        });
    } catch (err) {
        next(err);
    }
}

// PUT /:id - Update service details
async function updateService(req, res, next) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID format'
            });
        }

        const { name, description, features, isActive, companyId } = req.body;
        const updates = {};

        if (name !== undefined) updates.name = name.trim();
        if (description !== undefined) updates.description = description.trim();
        if (features !== undefined) updates.features = Array.isArray(features) ? features : [];
        if (isActive !== undefined) updates.isActive = Boolean(isActive);

        if (companyId) {
            if (!mongoose.Types.ObjectId.isValid(companyId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid companyId format'
                });
            }
            const companyExists = await Company.findById(companyId);
            if (!companyExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Company not found'
                });
            }
            updates.companyId = companyId;
        }

        const updatedService = await Service.findByIdAndUpdate(
            id,
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        ).populate('companyId', 'name email logo');

        if (!updatedService) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Service updated successfully',
            service: updatedService
        });
    } catch (err) {
        next(err);
    }
}

// PATCH /:id/status - Toggle or set service active status
async function updateServiceStatus(req, res, next) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID format'
            });
        }

        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Set to explicit boolean if provided, otherwise toggle
        const newStatus = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !service.isActive;

        service.isActive = newStatus;
        await service.save();

        return res.status(200).json({
            success: true,
            message: `Service status updated to ${newStatus ? 'active' : 'inactive'}`,
            service
        });
    } catch (err) {
        next(err);
    }
}

// DELETE /:id - Delete service
async function deleteService(req, res, next) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID format'
            });
        }

        const deletedService = await Service.findByIdAndDelete(id);

        if (!deletedService) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createService,
    getAllServices,
    getServiceById,
    getCompanyServices,
    updateService,
    updateServiceStatus,
    deleteService
};