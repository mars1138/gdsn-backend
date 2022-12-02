const express = require('express');
const { check } = require('express-validator');

const placesControllers = require('../controllers/products-controller');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/:pid', productsControllers.getProductById);

router.get('/user/:uid', placesControllers.getProductsByUserId);

router.use(checkAuth);

router.post(
  '/',
  fileUpload.single('image'),
  [
    check('name').not().isEmpty(),
    check('description').isLength({ min: 10 }),
    check('gtin').isLength({ min: 14 }),
  ],
  productsControllers.createProduct
);

router.patch(
  '/:pid',
  [check('name').not().isEmpty(), check('description').isLength({ min: 10 })],
  productsControllers.updateProduct
);

router.delete('/:pid', productsControllers.deleteProduct);
