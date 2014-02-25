
var fs = require('fs');

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
