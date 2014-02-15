module.exports = function(req, res, callback) {
    callback(null, {
        code: res.statusCode,
        title: require('http').STATUS_CODES[res.statusCode],
        jasine: require('../package.json').version,
        node: process.versions.node
    });
};
