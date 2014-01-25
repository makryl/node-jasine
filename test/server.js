var http = require('http');
var jsins = require('../index');

http.createServer(jsins({
    directory: __dirname + "/pub",
    logLevel: "debug"
})).listen(8008, 'localhost');
