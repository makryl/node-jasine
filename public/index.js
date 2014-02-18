module.exports = function(request, response, callback) {
    callback(null, {
        code: response.statusCode,
        title: require('http').STATUS_CODES[response.statusCode] || "Unknown Error",
        jasine: require('../package.json').version,
        node: process.versions.node
    });
};
