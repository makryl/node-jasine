var fs = require('fs');
var lib = require(__dirname + '/../lib');

module.exports = function(request, response, callback) {
    var data = {
        foo: 'foooooo'
    };

    lib.readCode(data, {
        codeController: __filename,
        codeTemplate: __dirname + '/foo.jsin',
        codeLayout: __dirname + '/layout.jsin'
    }, function(err) {
        if (err) {
            callback(err);
        } else {
            callback(null, data);
        }
    });
};
