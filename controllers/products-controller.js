const uuid = require('uuid').v4;
const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const HttpError = require('../models/http-error.js');
const Product = require('../models/product');
const User = require('../models/user');

const bucketName = `${process.env.BUCKET_NAME}`;
const bucketRegion = `${process.env.BUCKET_REGION}`;
const accessKey = `${process.env.ACCESS_KEY}`;
const secretAccessKey = `${process.env.SECRET_ACCESS_KEY}`;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

const getProductById = async (req, res, next) => {
  const prodId = req.params.pid;

  let product;

  try {
    product = await Product.find({ gtin: prodId });
    // console.log('loaded product: ', product);
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

  const returnProducts = userWithProducts.products.map((product) =>
    product.toObject({ getters: true })
  );

  // console.log('returnProducts: ', returnProducts);

  for (product of returnProducts) {
    product.image = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: product.image,
      }),
      { expiresIn: 3600 } // 60 seconds
    );
    // console.log('product: ', product);
  }

  res.json(returnProducts);
};

const createProduct = async (req, res, next) => {
  // console.log('req.body: ', req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log('validationResult: ', errors);
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
    // dateAdded,
    // datePublished,
    // dateInactive,
    // dateModified,
  } = req.body;

  const fileType = req.file.mimetype.split('/')[1];
  const imageName = `${uuid()}.${fileType}`;
  console.log('imageName: ', imageName);

  const createdProd = new Product({
    name,
    description,
    gtin,
    category,
    type,
    // image: req.file ? req.file.path : null,
    image: req.file ? imageName : null,
    height,
    width,
    depth,
    weight,
    packagingType,
    tempUnits,
    minTemp,
    maxTemp,
    storageInstructions,
    subscribers: [],
    dateAdded: new Date().toISOString(),
    datePublished: null,
    dateInactive: null,
    dateModified: null,
    owner: req.userData.userId,
  });
  console.log('createdProd: ', createdProd);
  let params;
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

  // console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdProd.save({ session: sess });
    user.products.push(createdProd);
    await user.save({ session: sess });

    if (req.file) {
      params = {
        Bucket: bucketName,
        Key: imageName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      await s3.send(new PutObjectCommand(params));
    }

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
    // image,
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
    // datePublished,
    dateInactive,
    // dateModified,
  } = req.body;

  // console.log('subscribers: ', subscribers);

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

  // console.log(product[0].owner);
  // console.log(req.userData.userId);

  if (product[0].owner != req.userData.userId) {
    const error = new HttpError(
      'You are not authorized to edit this place.',
      401
    );
    return next(error);
  }

  if (name) product[0].name = name;
  if (description) product[0].description = description;
  // gtin,
  if (category) product[0].category = category;
  // type,
  if (height) product[0].height = height;
  if (width) product[0].width = width;
  if (depth) product[0].depth = depth;
  if (weight) product[0].weight = weight;
  if (packagingType) product[0].packagingType = packagingType;
  if (tempUnits) product[0].tempUnits = tempUnits;
  if (minTemp) product[0].minTemp = minTemp;
  if (maxTemp) product[0].maxTemp = maxTemp;
  if (storageInstructions) product[0].storageInstructions = storageInstructions;

  let fileType;
  let oldImage;
  let newImage;

  if (req.file) {
    // fs.unlink(product[0].image, (error) => {
    //   // console.log('app.use: ', error);
    // });
    fileType = req.file.mimetype.split('/')[1];
    oldImage = product[0].image;
    newImage = `${uuid()}.${fileType}`;
    product[0].image = newImage;
  }

  if (subscribers[0]) {
    const subArray = subscribers.split(',');
    product[0].subscribers = [];
    subArray.forEach((sub) => product[0].subscribers.push(+sub));
    product[0].datePublished = new Date().toISOString();
  }

  if (!subscribers[0] || !subscribers) {
    product[0].subscribers = [];
    product[0].datePublished = null;
  }

  if (dateInactive === new Date(0).toISOString()) {
    product[0].dateInactive = null;
  } else {
    product[0].dateInactive = dateInactive;
  }
  product[0].dateModified = new Date().toISOString();

  // console.log('product: ', product);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await product[0].save();

    if (req.file) {
      //save new image
      saveParams = {
        Bucket: bucketName,
        Key: newImage,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      await s3.send(new PutObjectCommand(saveParams));

      //delete old image
      deleteParams = {
        Bucket: bucketName,
        Key: oldImage,
      };
      await s3.send(new DeleteObjectCommand(deleteParams));
    }

    await sess.commitTransaction();
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

  let deleteProd, deleteUser;

  try {
    deleteProd = await Product.find({ gtin: prodId });
    console.log('deleteProd: ', deleteProd);
    console.log('deleteProdOwner: ', deleteProd[0].owner);
    deleteUser = await User.findById(deleteProd[0].owner);
    console.log('deleteUser: ', deleteUser);
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

  // console.log(deleteProd[0].owner);
  // console.log(req.userData.userId);

  if (deleteProd[0].owner != req.userData.userId) {
    const error = new HttpError(
      'You are not authorized to delete this product.',
      401
    );
    return next(error);
  }

  const imagePath = deleteProd[0].image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await deleteProd[0].remove({ session: sess });
    deleteUser.products.pull(deleteProd[0].id);
    await deleteUser.save({ session: sess });

    if (imagePath) {
      const params = {
        Bucket: bucketName,
        Key: imagePath,
      };
      await s3.send(new DeleteObjectCommand(params));
    }

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
