const path = require('path');
const Product = require(path.join(__dirname, '..', 'models', 'Product'));
const Order = require(path.join(__dirname, '..', 'models', 'Order'));
const asyncHandler = require(path.join(__dirname, '..', 'utils', 'asyncHandler'));

const toDateDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const getPriceIntelligence = asyncHandler(async (req, res) => {
  const { crop, location } = req.query;

  const match = {
    isActive: true,
    approved: true,
  };

  if (crop) {
    match.$or = [
      { category: { $regex: crop, $options: 'i' } },
      { name: { $regex: crop, $options: 'i' } },
    ];
  }

  if (location) {
    match.location = { $regex: location, $options: 'i' };
  }

  const commodityStats = await Product.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $cond: [
            { $gt: [{ $strLenCP: { $ifNull: ['$category', ''] } }, 0] },
            '$category',
            '$name',
          ],
        },
        averagePrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        listingCount: { $sum: 1 },
      },
    },
    { $sort: { listingCount: -1 } },
    { $limit: 20 },
  ]);

  const locationStats = await Product.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$location',
        averagePrice: { $avg: '$price' },
        listingCount: { $sum: 1 },
      },
    },
    { $sort: { listingCount: -1 } },
    { $limit: 10 },
  ]);

  const now = new Date();
  const previousWindowStart = toDateDaysAgo(60);
  const currentWindowStart = toDateDaysAgo(30);

  const [previousDemand, currentDemand] = await Promise.all([
    Order.countDocuments({
      createdAt: { $gte: previousWindowStart, $lt: currentWindowStart },
      status: { $in: ['paid', 'confirmed', 'shipped', 'delivered'] },
    }),
    Order.countDocuments({
      createdAt: { $gte: currentWindowStart, $lte: now },
      status: { $in: ['paid', 'confirmed', 'shipped', 'delivered'] },
    }),
  ]);

  const demandDelta = currentDemand - previousDemand;
  const demandDirection = demandDelta > 0 ? 'rising' : demandDelta < 0 ? 'softening' : 'stable';

  const recommendations = commodityStats.map((item) => {
    const recommendedSellingPrice = Math.round(item.averagePrice * 1.05);
    return {
      crop: item._id || 'General Produce',
      listingCount: item.listingCount,
      averagePrice: Math.round(item.averagePrice),
      minPrice: Math.round(item.minPrice),
      maxPrice: Math.round(item.maxPrice),
      recommendedSellingPrice,
      bestSellingLocation:
        locationStats.length > 0
          ? locationStats.reduce((best, loc) => (loc.averagePrice > best.averagePrice ? loc : best))._id
          : 'National Marketplace',
      demandForecast: demandDirection,
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      recommendations,
      demand: {
        previous30DaysOrders: previousDemand,
        current30DaysOrders: currentDemand,
        direction: demandDirection,
      },
      generatedAt: new Date().toISOString(),
    },
  });
});

module.exports = {
  getPriceIntelligence,
};
