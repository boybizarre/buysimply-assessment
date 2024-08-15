const crypto = require('crypto');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const STAFF = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/staff.json`));

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user.id);

  // const cookieOptions = {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  //   ),
  //   secure: true,
  //   httpOnly: true,
  //   // secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  // };

  console.log('working here');
  // res.cookie('jwt', token, cookieOptions);

  // remove the password field
  const userWithoutPassword = { ...user };
  userWithoutPassword.password = undefined;
  console.log(STAFF);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userWithoutPassword,
    },
  });
};

exports.login = (req, res, next) => {

  const { email, password } = req.body;

  // check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide an email and password!', 400));
  }

  // check if user exist and password is correct
  const user = STAFF.find((user) => user.email === email)

  console.log(user);
  console.log({email, password});

  if (!user || user.password !== password) {
    console.log('here!')
    return next(new AppError('Invalid email or password!', 401));
  };

  // return token if every check passed
  createSendToken(user, 200, req, res);

  // res.status(200).json({
  //   status: 'success',
  //   text: 'ok',

  //   // data: {
  //   //   email,
  //   //   password,
  //   // }
  // });
}

exports.protect = catchAsync(async (req, res, next) => {
  // Getting token and check it it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  console.log('got here!', token)

  if (!token) {
    return next(
      next(
        new AppError(
          'You are not logged in! Please log in to get access.',
          401,
        ),
      ),
    );
  }
  // verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded, 'decoded');
  // check if user still exist incase of user changing password or stole token
  // using decoded.id we can verify we are selecting the user for which we verified a token for
  // const freshUser = await User.findById(decoded.id);
  const freshUser = STAFF.find((user) => user.id === decoded.id);

  if (!freshUser) {
    return next(
      new AppError('The user belonging to this token no longer exists', 401),
    );
  }

  // grant access to the protected route
  req.user = freshUser;
  console.log(req.user);
  next();
});

exports.restrictTo =
  (...roles) =>
    (req, _, next) => {
      // roles ['superAdmin', 'admin']
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError('You do not have permission to perform this action', 403),
        );
      }

      next();
    };

// removing jwt token from cookies on log out
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
};
