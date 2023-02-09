const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError('Fetching users failed, please try again', 500);
    return next(error);
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors);
    return next(
      new HttpError('Invalid inputs passed, please check your data', 422)
    );
  }

  // console.log(req.body);

  const { name, company, email, password } = req.body;
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    console.log(err);
    const error = new HttpError('Signup failed, please try again', 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError('User with that email already exists', 422);
    return next(error);
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Could not create new user, please try again (bcrypt)',
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    company,
    email,
    password: hashedPassword,
    created: new Date().toISOString(),
    products: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    console.log(err.message);
    const error = new HttpError(
      'Signup failed, unable to create user.  Please try again!',
      500
    );
    return next(error);
  }

  let token;

  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError('Signup failed, please try again!', 500);
    return next(error);
  }

  res.status(201).json({
    message: 'Signup successful!',
    userData: {
      userId: createdUser.id,
      email: createdUser.email,
      token: token,
    },
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  let isValidPassword;
  let token;

  console.log('req.body: ', req.body);

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError('Login failed, please try again later', 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in',
      403
    );
    return next(error);
  }

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check credentials and try again',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, unable to log you in',
      401
    );
    return next(error);
  }

  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
    console.log('token: ', token);
  } catch (err) {
    const error = new HttpError('Login failed, please try again!', 500);
    return next(error);
  }

  res.json({
    message: 'login successful!',
    userData: {
      userId: existingUser.id,
      email: existingUser.email,
      token: token,
    },
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
