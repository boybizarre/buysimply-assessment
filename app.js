const express = require("express");
const dotenv = require('dotenv');

const AppError = require("./utils/appError.js");
const globalErrorHandler = require('./controllers/errorController');

// routes
const userRouter = require('./routes/userRoutes.js')
const loanRouter = require('./routes/loanRoutes.js')


dotenv.config({ path: './config.env' });
const app = express()
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10kb' }));

app.use('/api/v1/users', userRouter);
app.use('/api/v1/loans', loanRouter);

app.use('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// global error handling middleware
app.use(globalErrorHandler);

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// unhandled rejections are errors that have to do with unresolved promises
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);

  // By doing this we are giving the server time to run the remaining requests and gracefully shutdown
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋🏽 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💥 Process terminated.');
  });
});
