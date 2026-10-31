const mongoose = require('mongoose');
const { Discount } = require('../model/discountModel');
const { Service } = require('../model/serviceModel');

// POST /api/discounts - Create a new discount linked to an existing product
async function createDiscount(req, res, next) {
    try {
        const { code, name, type, value, serviceId, description, expiresAt, isActive } = req.body;

        if (!code || !name || value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Discount code, name, and value are required'
            });
        }

        const cleanCode = code.trim().toUpperCase();
        const existing = await Discount.findOne({ code: cleanCode });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Discount code '${cleanCode}' already exists`
            });
        }

        let validServiceId = null;
        if (serviceId && serviceId !== 'all') {
            if (!mongoose.Types.ObjectId.isValid(serviceId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product/service ID'
                });
            }
            const service = await Service.findById(serviceId);
            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Selected product does not exist in database'
                });
            }
            validServiceId = serviceId;
        }

        const newDiscount = await Discount.create({
            code: cleanCode,
            name: name.trim(),
            type: type === 'fixed' ? 'fixed' : 'percentage',
            value: Number(value),
            serviceId: validServiceId,
            description: (description || '').trim(),
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            isActive: isActive !== undefined ? Boolean(isActive) : true
        });

        const populated = await Discount.findById(newDiscount._id).populate('serviceId', 'name price duration');

        return res.status(201).json({
            success: true,
            message: 'Discount created successfully',
            discount: populated
        });
    } catch (err) {
        next(err);
    }
}

// GET /api/discounts - Get all discounts
async function getAllDiscounts(req, res, next) {
    try {
        const { serviceId, isActive } = req.query;
        const filter = {};

        if (serviceId) {
            if (mongoose.Types.ObjectId.isValid(serviceId)) {
                filter.$or = [
                    { serviceId: serviceId },
                    { serviceId: null }
                ];
            }
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true' || isActive === true;
        }

        const discounts = await Discount.find(filter)
            .populate('serviceId', 'name price duration description')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: discounts.length,
            discounts
        });
    } catch (err) {
        next(err);
    }
}

// GET /api/discounts/:id
async function getDiscountById(req, res, next) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid discount ID' });
        }

        const discount = await Discount.findById(id).populate('serviceId', 'name price duration');
        if (!discount) {
            return res.status(404).json({ success: false, message: 'Discount not found' });
        }

        return res.status(200).json({ success: true, discount });
    } catch (err) {
        next(err);
    }
}

// PUT /api/discounts/:id
async function updateDiscount(req, res, next) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid discount ID' });
        }

        const updates = { ...req.body };
        if (updates.code) updates.code = updates.code.trim().toUpperCase();
        if (updates.serviceId === 'all') updates.serviceId = null;

        const updated = await Discount.findByIdAndUpdate(id, updates, { new: true })
            .populate('serviceId', 'name price duration');

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Discount not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Discount updated successfully',
            discount: updated
        });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/discounts/:id
async function deleteDiscount(req, res, next) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid discount ID' });
        }

        const deleted = await Discount.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Discount not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Discount deleted successfully'
        });
    } catch (err) {
        next(err);
    }
}

// POST /api/discounts/validate - Validate code for a service
async function validateDiscount(req, res, next) {
    try {
        const { code, serviceId } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: 'Discount code is required' });
        }

        const cleanCode = code.trim().toUpperCase();
        const discount = await Discount.findOne({ code: cleanCode, isActive: true })
            .populate('serviceId', 'name price duration');

        if (!discount) {
            return res.status(404).json({ success: false, message: 'Invalid or inactive discount code' });
        }

        if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
            return res.status(400).json({ success: false, message: 'This discount code has expired' });
        }

        // If discount is bound to a specific service, verify match
        if (discount.serviceId && serviceId) {
            const boundId = discount.serviceId._id ? discount.serviceId._id.toString() : discount.serviceId.toString();
            if (boundId !== serviceId.toString()) {
                return res.status(400).json({
                    success: false,
                    message: `This coupon is exclusively for product "${discount.serviceId.name}"`
                });
            }
        }

        return res.status(200).json({
            success: true,
            discount
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createDiscount,
    getAllDiscounts,
    getDiscountById,
    updateDiscount,
    deleteDiscount,
    validateDiscount
};

