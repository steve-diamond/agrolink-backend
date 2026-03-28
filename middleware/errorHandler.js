// Error handler middleware placeholder
module.exports = (err, req, res, next) => { res.status(500).json({ error: err.message }); };
