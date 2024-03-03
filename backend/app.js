const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');


const spotsRouter = require('./routes/api/spots');
const usersRouter = require('./routes/api/users');
const reviewsRouter = require('./routes/api/reviews'); 

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


app.use('/api/spots', spotsRouter);
app.use('/api/users', usersRouter); 
app.use('/api/reviews', reviewsRouter); 


app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the API' });
});



app.use((_req, _res, next) => {
  const err = new Error("The requested resource couldn't be found.");
  err.status = 404;
  next(err);
});

// validation
const { ValidationError } = require('sequelize');
app.use((err, _req, _res, next) => {
  if (err instanceof ValidationError) {
    err.status = 400;
    err.errors = err.errors.reduce((acc, current) => {
      acc[current.path] = current.message;
      return acc;
    }, {});
  }
  next(err);
});

// errors
app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
    stack: isProduction ? null : err.stack
  });
});

module.exports = app;