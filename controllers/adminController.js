const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const getAllUsers = async (req, res) => {
	try {
		const users = await User.find().select("-password").sort({ createdAt: -1 });
		return res.status(200).json({ users });
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch users", error: error.message });
	}
};

const getAllProducts = async (req, res) => {
	try {
		const products = await Product.find().sort({ createdAt: -1 });
		return res.status(200).json({ products });
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch products", error: error.message });
	}
};

const approveProduct = async (req, res) => {
	try {
		const { productId } = req.params;

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		product.approved = true;
		await product.save();

		return res.status(200).json({ message: "Product approved successfully", product });
	} catch (error) {
		return res.status(500).json({ message: "Failed to approve product", error: error.message });
	}
};

const deleteUser = async (req, res) => {
	try {
		const { userId } = req.params;

		const user = await User.findByIdAndDelete(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete user", error: error.message });
	}
};

const getAllOrders = async (req, res) => {
	try {
		const orders = await Order.find()
			.sort({ createdAt: -1 })
			.populate("productId")
			.populate("buyerId", "-password");

		return res.status(200).json({ orders });
	} catch (error) {
		return res.status(500).json({ message: "Failed to fetch orders", error: error.message });
	}
};

module.exports = {
	getAllUsers,
	getAllProducts,
	approveProduct,
	deleteUser,
	getAllOrders,
};
