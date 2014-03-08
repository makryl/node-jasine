
var fs = require('fs');
var qs = require('querystring');

module.exports.readCode = function(data, files, callback) {
    var pending = 1;

    function end() {
        if (0 === --pending) {
            callback();
        }
    }

    for (var i in files) {
        ++pending;
        (function(i){
            fs.readFile(files[i], {encoding: 'utf8'}, function(err, buf) {
                if (err) {
                    callback(err);
                } else {
                    data[i] = buf;
                    end();
                }
            });
        })(i);
    }

    end();
};

module.exports.processPost = function(req, callback) {
    if ('POST' === req.method) {
        var post = '';
        req.on('data', function(buf) {
            post += buf;
            if (post.length > 1e6) {
                post = "";
                req.connection.destroy();
                callback(413);
            }
        });

        req.on('end', function() {
            callback(null, qs.parse(post));
        });
    } else {
        callback(null, {});
    }
}
