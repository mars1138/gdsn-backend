const mongoose = require('mongoose');
// const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  created: { type: Date },
  products: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Product' }],
});

// temporarily commented out; produces error: User validation failed: _id: Error, expected `_id` to be unique
// when calling deletePlace in places-controller
// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
