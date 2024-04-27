const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const spotImagesRouter = require('./routes/api/spot-images');
const reviewImagesRouter = require('./routes/api/review-images');

// import spotsRouter
const spotsRouter = require('./routes/api/spots');

const { environment } = require('./config');
const isProduction = environment === 'production';

const app = express();

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());

if (!isProduction) {
  app.use(cors());
}

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(csurf({
  cookie: {
    secure: isProduction,
    sameSite: isProduction && "Lax",
    httpOnly: true
  }
}));

// using spots routers
app.use('/api/spots', spotsRouter);

//new spot and review images routers that i should have always had
app.use('/api/spot-images', spotImagesRouter);
app.use('/api/review-images', reviewImagesRouter);

// the rest of my routes
const routes = require('./routes');
app.use(routes);

// got errors on render so adding this
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the API' });
});

// this is only for errors
app.use((_req, _res, next) => {
  const err = new Error("The requested resource couldn't be found.");
  err.title = "Resource Not Found";
  err.errors = { "message": "The requested resource couldn't be found." };
  err.status = 404;
  next(err);
});

// errors sequelize related
const { ValidationError } = require('sequelize');
app.use((err, _req, _res, next) => {
  if (err instanceof ValidationError) {
    const errors = {};
    err.errors.forEach(error => {
      errors[error.path] = error.message;
    });
    err.title = 'Validation error';
    err.errors = errors;
    err.status = 400;
  }
  next(err);
});

// Errors
app.use((err, _req, res, _next) => {
  res.status(err.status || 500);
  console.error(err);

  const errorResponse = {
    title: err.title || 'Server Error',
    message: err.message,
    errors: err.errors,
  };

  if (!isProduction) {
    errorResponse.stack = err.stack;
  }

  res.json(errorResponse);
});

module.exports = app;