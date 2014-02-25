var url = require('url');
var lib = require(__dirname + '/../lib');

module.exports = function(request, response, callback) {
    var data = {
        count: parseInt(url.parse(request.url, true).query.count) || 0
    };

    lib.readCode(data, {
        clickmeController: __filename,
        clickmeTemplate: __dirname + '/click-me.jsin'
    }, function(err) {
        if (err) {
            callback(err);
        } else {
            callback(null, data);
        }
    });
};
