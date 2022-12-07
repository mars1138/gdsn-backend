const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const productsRoutes = require('./routes/products-routes');
const usersRoutes = require('./routes/users-routes');
const contactRoutes = require('./routes/contact-routes');

const app = express();
const cors = require('cors');

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use(cors());
// app.use(cors({ origin: `${process.env.CLIENT_URL}` }));

app.use('/api/products', productsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/contact', contactRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    console.log('req.file.path: ', req.file.path);
    fs.unlink(req.file.path, error => {
      console.log(error);
    });
  }

  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

// object added as 2nd argument for connect() as workaround to avoid error: User validation failed: _id: Error, expected `_id` to be unique. Value: `.....`
// occurs if user database in mongoDB has more than 1 user
// must use mongoose 5.11.3 and mongoose-unique-validator 2.0.3 until solution can be found
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ykppkft.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true },
  )
  .then(() => app.listen(process.env.PORT || 5000))
  .catch(err => console.log(err));
