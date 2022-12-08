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
    console.log('loaded product: ', product);
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

  res.json({ product: product[0].toObject({ getters: true }) });
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

  res.status(201).json({ product: createdProd.toObject({ getters: true }) });
};

const updateProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data', 422),
    );
  }

  const {
    name,
    description,
    // gtin,
    category,
    // type,
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
    // dateAdded,
    datePublished,
    dateInactive,
    dateModified,
  } = req.body;

  const prodId = req.params.pid;

  let product;

  try {
    product = await Product.find({ gtin: prodId });
    console.log('loaded product: ', product);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update product',
      500,
    );

    return next(error);
  }

  // if (product.owner.toString() !== req.userData.userId) {
  //   const error = new HttpError(
  //     'You are not authorized to edit this place.',
  //     401,
  //   );
  //   return next(error);
  // }

  product[0].name = name;
  product[0].description = description;
  // gtin,
  product[0].category = category;
  // type,
  product[0].image = image;
  product[0].height = height;
  product[0].width = width;
  product[0].depth = depth;
  product[0].weight = weight;
  product[0].packagingType = packagingType;
  product[0].tempUnits = tempUnits;
  product[0].minTemp = minTemp;
  product[0].maxTemp = maxTemp;
  product[0].storageInstructions = storageInstructions;
  product[0].subscribers = subscribers;
  // dateAdded,
  product[0].datePublished = datePublished;
  product[0].dateInactive = dateInactive;
  product[0].dateModified = dateModified;

  console.log('product: ', product);

  try {
    await product.forEach(item => item.save());
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not update place',
      500,
    );
    return next(error);
  }

  res.status(200).json({ product: product[0].toObject({ getters: true }) });
};

const deleteProduct = async (req, res, next) => {};

exports.getProductById = getProductById;
exports.getProductsByUserId = getProductsByUserId;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
