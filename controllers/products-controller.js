const uuid = require('uuid').v4;
const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error.js');
const Product = require('../models/product');
const User = require('../models/user');

const getProductById = async (req, res, next) => {
  const prodId = req.params.pid;
  res.status(200).json({ message: 'get request received!', product: prodId });
};

const getProductsByUserId = async (req, res, next) => {};

const createProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
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
    subscribers,
  } = req.body;

  const createdProd = new Product({
    name,
    description,
    gtin,
    category,
    type,
    image,
    subscribers,
  });

  console.log(createdProd);

  res.status(201).json({ product: createdProd });

  //   res.status(201).json({ message: 'Post request received!' });
};

const updateProduct = async (req, res, next) => {};

const deleteProduct = async (req, res, next) => {};

exports.getProductById = getProductById;
exports.getProductsByUserId = getProductsByUserId;
exports.createProduct = createProduct;
exports.updateProduct = createProduct;
exports.deleteProduct = deleteProduct;
