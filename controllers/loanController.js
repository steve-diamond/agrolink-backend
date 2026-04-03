const path = require('path');
const Loan = require(path.join(__dirname, '..', 'models', 'Loan'));
const asyncHandler = require(path.join(__dirname, '..', 'utils', 'asyncHandler'));
const ApiError = require(path.join(__dirname, '..', 'utils', 'apiError'));

const toPositiveNumber = (value, fieldName) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new ApiError(400, `${fieldName} must be a positive number.`);
	}
	return parsed;
};

const createLoanApplication = asyncHandler(async (req, res) => {
	const {
		amount,
		purpose,
		farmSize,
		cooperativeRating,
		salesScore,
		requestedTermMonths,
	} = req.body;

	if (!purpose || typeof purpose !== 'string') {
		throw new ApiError(400, 'purpose is required.');
	}

	const loan = await Loan.create({
		farmer: req.user._id,
		amount: toPositiveNumber(amount, 'amount'),
		purpose: purpose.trim(),
		farmSize: farmSize !== undefined ? toPositiveNumber(farmSize, 'farmSize') : undefined,
		cooperativeRating: cooperativeRating !== undefined ? Number(cooperativeRating) : undefined,
		salesScore: salesScore !== undefined ? Number(salesScore) : undefined,
		requestedTermMonths:
			requestedTermMonths !== undefined ? toPositiveNumber(requestedTermMonths, 'requestedTermMonths') : undefined,
		status: 'pending',
	});

	res.status(201).json({
		status: 'success',
		message: 'Loan application submitted successfully.',
		data: { loan },
	});
});

const getMyLoans = asyncHandler(async (req, res) => {
	const loans = await Loan.find({ farmer: req.user._id }).sort('-createdAt');
	res.status(200).json({ status: 'success', data: { items: loans } });
});

const getAllLoans = asyncHandler(async (req, res) => {
	const loans = await Loan.find().sort('-createdAt');
	res.status(200).json({ status: 'success', data: { items: loans } });
});

const reviewLoanApplication = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { status, dueDate, notes } = req.body;

	if (!['approved', 'rejected'].includes(status)) {
		throw new ApiError(400, 'status must be approved or rejected.');
	}

	const loan = await Loan.findById(id);
	if (!loan) {
		throw new ApiError(404, 'Loan application not found.');
	}

	loan.status = status;
	loan.reviewedBy = req.user._id;
	loan.reviewedAt = new Date();
	loan.reviewNotes = notes ? String(notes).trim() : '';

	if (status === 'approved') {
		loan.issuedAt = new Date();
		if (dueDate) {
			loan.dueDate = new Date(dueDate);
		}
	}

	await loan.save();

	res.status(200).json({
		status: 'success',
		message: `Loan application ${status}.`,
		data: { loan },
	});
});

const markLoanRepaid = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const loan = await Loan.findById(id);

	if (!loan) {
		throw new ApiError(404, 'Loan not found.');
	}

	loan.status = 'repaid';
	loan.repaidAt = new Date();
	await loan.save();

	res.status(200).json({
		status: 'success',
		message: 'Loan marked as repaid.',
		data: { loan },
	});
});

module.exports = {
	createLoanApplication,
	getMyLoans,
	getAllLoans,
	reviewLoanApplication,
	markLoanRepaid,
};
