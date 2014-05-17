
var lib = require(__dirname + '/../../lib');

module.exports.index = function(request, response, callback) {
    var data = {
        text: 'This is "index" method in index controller'
    };

    lib.readCode(data, {
        codeController: __filename,
        codeTemplate: __dirname + '/index.jsin',
        codeLayout: __dirname + '/../layout.jsin'
    }, function(err) {
        if (err) {
            callback(err);
        } else {
            callback(null, data);
        }
    });
};

module.exports['index-check'] = function(request, response, callback) {
    var data = {
        text: 'This is "index-check" method in index controller',
        template: 'boo/index'
    };

    lib.readCode(data, {
        codeController: __filename,
        codeTemplate: __dirname + '/index.jsin',
        codeLayout: __dirname + '/../layout.jsin'
    }, function(err) {
        if (err) {
            callback(err);
        } else {
            callback(null, data);
        }
    });
};

module.exports.router = function(request, response, basename, callback) {
    var data = {
        text: 'This is "router" method in index controller with argument basename: "' + basename + '"',
        template: 'boo/index'
    };

    lib.readCode(data, {
        codeController: __filename,
        codeTemplate: __dirname + '/index.jsin',
        codeLayout: __dirname + '/../layout.jsin'
    }, function(err) {
        if (err) {
            callback(err);
        } else {
            callback(null, data);
        }
    });
}