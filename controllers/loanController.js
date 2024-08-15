const fs = require('fs');
const AppError = require('../utils/appError');

const LOANS = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/loans.json`));

exports.fetchAllLoans = (req, res) => {

  let fetchedLoans = [];

  let filter = {};
  // filtering out the applicant's totalLoans depending on user role fetching data
  if (req.user.role === 'staff') {
    fetchedLoans = LOANS.map(loan => {
      const { totalLoan, ...updatedApplicant } = loan.applicant;
      return {
        ...loan,
        applicant: {
          updatedApplicant,
        }
      }
    })
  }

  if (req.user.role === 'superAdmin' || req.user.role === 'admin') {
    fetchedLoans = LOANS;
  }

  // filtering loans based on loan status
  if (req.query && req.query.status) {
    fetchedLoans = fetchedLoans.filter(loan => loan.status === req.query.status);
  }

  res.status(200).json({
    status: 'success',
    results: fetchedLoans.length,
    data: {
      loans: fetchedLoans,
    },
  });
}

exports.fetchUserLoan = (req, res) => {
  const { userEmail } = req.params;

  const loans = LOANS.filter(loan => loan.applicant.email === userEmail);
  console.log(loans);

  res.status(200).json({
    status: 'success',
    results: loans.length,
    data: {
      loans,
    },
  });
}

exports.fetchExpiredLoans = (req, res) => {
  const expiredLoans = LOANS.filter((loan) => {
    const maturityDate = new Date(loan.maturityDate);
    const currentDate = new Date();
    return maturityDate < currentDate;
  });

  res.status(200).json({
    status: 'success',
    results: expiredLoans.length,
    data: {
      expiredLoans,
    },
  });
}

exports.deleteLoan = (req, res) => {
  const { loanId } = req.params;

  const loanToDelete = LOANS.find(loan => loan.id === loanId);
  if (!loanToDelete) {
    return res.status(404).json({
      status: 'error',
      message: 'Loan not found',
    });
  }

  LOANS.filter(loan => loan.id !== loanId);

  res.status(200).json({
    status: 'success',
    message: 'Loan deleted successfully',
  });
}