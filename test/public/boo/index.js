module.exports.index = function(request, response, callback) {
    var data = {
        text: 'This is index method in controller',
        template: 'boo/index'
    };
    callback(null, data);
};

module.exports['index-check'] = function(request, response, callback) {
    var data = {
        text: 'This is "index-check" method in index controller',
        template: 'boo/index'
    };
    callback(null, data);
};