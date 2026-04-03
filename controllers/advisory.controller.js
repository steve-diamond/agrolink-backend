const asyncHandler = require('../utils/asyncHandler');

const ADVISORY_BY_CROP = {
  maize: {
    plantingGuide: 'Use certified seeds, maintain proper spacing, and plant at the onset of steady rains.',
    fertilizerRecommendation: 'Apply NPK at 2-3 weeks after planting, then top-dress with urea at 5-6 weeks.',
    pestWarning: 'Scout weekly for fall armyworm and stem borers; intervene early.',
  },
  rice: {
    plantingGuide: 'Use recommended varieties and maintain proper field water levels.',
    fertilizerRecommendation: 'Split nitrogen applications to improve tillering and grain fill.',
    pestWarning: 'Watch for blast disease and stem borers during high humidity periods.',
  },
  cassava: {
    plantingGuide: 'Plant healthy stem cuttings on ridges and avoid waterlogged soils.',
    fertilizerRecommendation: 'Use balanced NPK and potassium supplements in depleted soils.',
    pestWarning: 'Monitor for cassava mosaic and bacterial blight.',
  },
};

const getAdvisoryFeed = asyncHandler(async (req, res) => {
  const crop = String(req.query.crop || 'maize').toLowerCase();
  const region = String(req.query.region || 'Nigeria');
  const weather = String(req.query.weather || 'seasonal-watch');
  const advisory = ADVISORY_BY_CROP[crop] || ADVISORY_BY_CROP.maize;

  const weatherAlert =
    weather === 'heavy-rain'
      ? 'Heavy rain expected. Improve drainage and delay fertilizer broadcasting until conditions stabilize.'
      : 'Track local weather shifts and align planting/harvest windows to reduce avoidable losses.';

  res.status(200).json({
    status: 'success',
    data: {
      crop,
      region,
      weatherAlert,
      ...advisory,
      sources: ['Food and Agriculture Organization (FAO)', 'International Institute of Tropical Agriculture (IITA)'],
      generatedAt: new Date().toISOString(),
    },
  });
});

const getAdvisories = asyncHandler(async (req, res) => {
  // Backward-compatible alias.
  return getAdvisoryFeed(req, res);
});

module.exports = {
  getAdvisories,
  getAdvisoryFeed,
};
