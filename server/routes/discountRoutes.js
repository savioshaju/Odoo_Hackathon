const express = require('express');
const router = express.Router();

const {
    createDiscount,
    getAllDiscounts,
    getDiscountById,
    updateDiscount,
    deleteDiscount,
    validateDiscount
} = require('../controller/discountController');

router.use((req, res, next) => {
    console.log('Routes: Discounts');
    next();
});

router.get('/', getAllDiscounts);
router.post('/', createDiscount);
router.post('/validate', validateDiscount);
router.get('/:id', getDiscountById);
router.put('/:id', updateDiscount);
router.delete('/:id', deleteDiscount);

const discountRouter = router;
module.exports = { discountRouter };

