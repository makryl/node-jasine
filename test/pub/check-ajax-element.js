var url = require('url');

module.exports = function(req, res, callback) {
    var data = {
        count: parseInt(url.parse(req.url, true).query.count) || 0
    };
    callback(null, data);
};
