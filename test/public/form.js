var fs = require('fs');
var url = require('url');
var lib = require(__dirname + '/../lib');

module.exports = function(request, response, callback) {
    var query = url.parse(request.url, true).query;
    var data = {
        mygetinput: query.mygetinput || '',
        mycheckbox: query.mycheckbox || null,
        myradio: query.myradio || null,
        myselect: query.myselect || null,
        mytextarea: query.mytextarea || '',
        mysubmit: typeof query.mysubmit !== 'undefined',

        mypostinput: ''
    };

    var pending = 3;
    function end() {
        if (!--pending) {
            callback(null, data);
        }
    }

    lib.processPost(request, function(err, post) {
        if (err) {
            callback(err);
        } else {
            if (post.mypostinput) {
                data.mypostinput = post.mypostinput;
            }
            end();
        }
    });

    lib.readCode(data, {
        codeController: __filename,
        codeTemplate: __dirname + '/form.jsin',
        codeLayout: __dirname + '/layout.jsin'
    }, function(err) {
        if (err) {
            callback(err);
        } else {
            end();
        }
    });

    end();
};
