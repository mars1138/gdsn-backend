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
      500
    );

    return next(error);
  }

  if (!product) {
    const error = new HttpError(
      'Could not find a place for the provided id',
      404
    );
    return next(error);
  }

  res.json({ product: product[0].toObject({ getters: true }) });
};

const getProductsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithProducts;

  try {
    userWithProducts = await User.findById(userId).populate('products');
  } catch (err) {
    const error = new HttpError(
      'Fetching user products failed, please try again',
      500
    );
    return next(error);
  }

  if (!userWithProducts) {
    return next('Could not find products for the provided user id', 404);
  }

  res.json({
    products: userWithProducts.products.map((product) =>
      product.toObject({ getters: true })
    ),
  });
};

const createProduct = async (req, res, next) => {
  console.log('req.body: ', req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('validationResult: ', errors);
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

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
    owner: req.userData.userId,
  });

  console.log('createdProd: ', createdProd);

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError('Creating place failed, please try again', 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id', 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdProd.save({ session: sess });
    user.products.push(createdProd);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err.message);
    const error = new HttpError(
      'Creating place failed, please try again!',
      500
    );
    return next(error);
  }

  res.status(201).json({ product: createdProd.toObject({ getters: true }) });
};

const updateProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data', 422)
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
      500
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
    await product[0].save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not update product',
      500
    );
    return next(error);
  }

  res.status(200).json({ product: product[0].toObject({ getters: true }) });
};

const deleteProduct = async (req, res, next) => {
  const prodId = req.params.pid;

  let deleteProd;

  try {
    deleteProd = await Product.find({ gtin: prodId });
    console.log('deleteProd: ', deleteProd);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete product',
      500
    );

    return next(error);
  }

  if (!deleteProd || deleteProd.length === 0) {
    const error = new HttpError('Could not find product for this id', 404);
    return next(error);
  }

  // if (deleteProd.owner.id !== req.userData.userId) {
  //   const error = new HttpError(
  //     'You are not authorized to delete this product.',
  //     401
  //   );
  //   return next(error);
  // }

  // const imagePath = deleteProd.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await deleteProd[0].remove({ session: sess });
    // deleteProd.owner.places.pull(deleteProd);
    // await deleteProd.owner.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not complete product delete',
      500
    );
    return next(error);
  }

  // fs.unlink(imagePath, (err) => {
  //   console.log(err);
  // });

  res.status(200).json({
    message: `Product ${prodId} ${deleteProd[0].name} has been deleted`,
  });
};

exports.getProductById = getProductById;
exports.getProductsByUserId = getProductsByUserId;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
