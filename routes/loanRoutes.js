const express = require("express");

const loanController = require('../controllers/loanController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.get('/', authController.restrictTo('superAdmin'), userController.fetchLoans);

// protects all routes after middleware
router.use(authController.protect);

router.get('/', loanController.fetchAllLoans);
router.get('/:userEmail/get', loanController.fetchUserLoan);
router.get('/expired', loanController.fetchExpiredLoans);
router.delete('/:loanId/delete', authController.restrictTo('admin', 'superAdmin'), loanController.deleteLoan);


module.exports = router;
