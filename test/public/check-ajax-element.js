var url = require('url');

module.exports = function(request, response, callback) {
    var data = {
        count: parseInt(url.parse(request.url, true).query.count) || 0
    };
    callback(null, data);
};
