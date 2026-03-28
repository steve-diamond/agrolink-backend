const express = require("express");

const router = express.Router();

const adminMiddleware = require("../src/middleware/adminMiddleware");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const {
	getAllUsers,
	getAllProducts,
	approveProduct,
	deleteUser,
	getAllOrders,
} = require("../controllers/adminController");

const serializeOrder = (order) => {
	const rawOrder = typeof order.toObject === "function" ? order.toObject() : order;
	const firstProduct = rawOrder.products?.[0] || null;
	const quantity = (rawOrder.products || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

	return {
		...rawOrder,
		buyerId: rawOrder.user,
		productId: firstProduct?.productId || null,
		quantity,
		totalPrice: rawOrder.totalAmount,
	};
};

router.use(adminMiddleware);

router.get("/dashboard", async (req, res) => {
	try {
		const [
			totalUsers,
			totalFarmers,
			totalBuyers,
			totalProducts,
			totalOrders,
			pendingOrders,
			paidOrders,
			deliveredOrders,
			totalRevenueAgg,
			recentUsers,
			recentOrders,
			recentProducts,
		] = await Promise.all([
			User.countDocuments(),
			User.countDocuments({ role: "farmer" }),
			User.countDocuments({ role: "buyer" }),
			Product.countDocuments(),
			Order.countDocuments(),
			Order.countDocuments({ status: "pending" }),
			Order.countDocuments({ status: "paid" }),
			Order.countDocuments({ status: "delivered" }),
			Order.aggregate([
				{ $match: { status: { $in: ["paid", "delivered"] } } },
				{ $group: { _id: null, total: { $sum: "$totalAmount" } } },
			]),
			User.find().select("-password").sort({ createdAt: -1 }).limit(5).lean(),
			Order.find()
				.sort({ createdAt: -1 })
				.limit(5)
				.populate("user", "name email role")
				.populate("products.productId", "name price")
				.lean(),
			Product.find().sort({ createdAt: -1 }).limit(5).lean(),
		]);

		const totalRevenue = totalRevenueAgg[0]?.total || 0;

		res.json({
			stats: {
				users: {
					total: totalUsers,
					farmers: totalFarmers,
					buyers: totalBuyers,
				},
				products: totalProducts,
				orders: {
					total: totalOrders,
					pending: pendingOrders,
					paid: paidOrders,
					delivered: deliveredOrders,
				},
				revenue: totalRevenue,
			},
			recent: {
				users: recentUsers,
				orders: recentOrders.map(serializeOrder),
				products: recentProducts,
			},
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.get("/users", getAllUsers);

router.patch("/users/:id/approve", async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		if (user.role !== "farmer") {
			return res.status(400).json({ message: "Only farmers can be approved" });
		}

		user.approved = true;
		await user.save();

		res.json({ message: "Farmer approved successfully", user });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.get("/products", getAllProducts);
router.patch("/products/:productId/approve", approveProduct);

router.get("/orders", getAllOrders);

router.patch("/orders/:id/status", async (req, res) => {
	try {
		const { status } = req.body;
		const allowed = ["pending", "paid", "delivered"];

		if (!allowed.includes(status)) {
			return res.status(400).json({ message: "Invalid status" });
		}

		const order = await Order.findById(req.params.id);
		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}

		order.status = status;
		if (status === "paid") {
			order.paymentStatus = "paid";
		}
		await order.save();

		res.json({ message: "Order status updated", order });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.delete("/users/:userId", deleteUser);

router.delete("/products/:id", async (req, res) => {
	try {
		const product = await Product.findByIdAndDelete(req.params.id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}
		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.delete("/orders/:id", async (req, res) => {
	try {
		const order = await Order.findByIdAndDelete(req.params.id);
		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}
		res.json({ message: "Order deleted successfully" });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
