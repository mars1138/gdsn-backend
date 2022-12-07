const uuid = require('uuid').v4;
const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error.js');
const Product = require('../models/product');
const User = require('../models/user');

const getProductById = async (req, res, next) => {
  const prodId = req.params.pid;

  let product;

  try {
    product = await Product.find({ gtin: prodId });
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find product',
      500,
    );

    return next(error);
  }

  if (!product) {
    const error = new HttpError(
      'Could not find a place for the provided id',
      404,
    );
    return next(error);
  }

  res.json({ message: 'get request received!', product });
};

const getProductsByUserId = async (req, res, next) => {};

const createProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422),
    );
  }

  console.log('req.body: ', req.body);

  const {
    name,
    description,
    gtin,
    category,
    type,
    image,
    height,
    width,
    depth,
    weight,
    packagingType,
    tempUnits,
    minTemp,
    maxTemp,
    storageInstructions,
    subscribers,
    dateAdded,
    datePublished,
    dateInactive,
    dateModified,
  } = req.body;

  const createdProd = new Product({
    name,
    description,
    gtin,
    category,
    type,
    image,
    height,
    width,
    depth,
    weight,
    packagingType,
    tempUnits,
    minTemp,
    maxTemp,
    storageInstructions,
    subscribers,
    dateAdded,
    datePublished,
    dateInactive,
    dateModified,
  });

  console.log('createdProd: ', createdProd);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdProd.save({ session: sess });
    // user.places.push(createdPlace);
    // await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err.message);
    const error = new HttpError(
      'Creating place failed, please try again!',
      500,
    );
    return next(error);
  }

  res.status(201).json({ product: createdProd });
};

const updateProduct = async (req, res, next) => {};

const deleteProduct = async (req, res, next) => {};

exports.getProductById = getProductById;
exports.getProductsByUserId = getProductsByUserId;
exports.createProduct = createProduct;
exports.updateProduct = createProduct;
exports.deleteProduct = deleteProduct;
