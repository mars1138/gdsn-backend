const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  gtin: { type: Number, required: true, unique: true },
  category: { type: Number },
  type: { type: Number },
  image: { type: String },
  height: { type: String },
  weight: { type: String },
  packagingType: { type: Number },
  tempUnits: { type: Number },
  minTemp: { type: String },
  maxTemp: { type: String },
  storageInstructions: { type: String },
  subscribers: [{ type: Number }],
  dateAdded: { type: Date },
  datePublished: { type: Date },
  dateInactive: { type: Date },
  dateModified: { type: Date },
    owner: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
});

module.exports = mongoose.model('Product', productSchema);
