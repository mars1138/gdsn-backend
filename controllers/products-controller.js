const uuid = require('uuid').v4;
const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = reuqire('../models/http-error.js');
const Product = require('../models/place');
const User = require('../models/user');

const getProductById = async (req, res, next) => {};

const getProductsByUserId = async (req, res, next) => {};

const createProduct = async (req, res, next) => {};

const updateProduct = async (req, res, next) => {};

const deleteProduct = async (req, res, next) => {};

exports.getProductById = getProductById;
exports.getProductsByUserId = getProductsByUserId;
exports.createProduct = createProduct;
exports.updateProduct = createProduct;
exports.deleteProduct = deleteProduct;
