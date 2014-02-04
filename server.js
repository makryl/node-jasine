#!/usr/bin/env node

/**
 * Copyright © 2014 Maksim Krylosov <Aequiternus@gmail.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var config = {
    protocol:       "http",
    host:           "localhost",
    port:           "8008",
    socket:         "",
    logLevel:       "info",
    directory:      __dirname + "/pub",
    error:          __dirname + "/pub/",
    mimeDefault:    "text/html",
    mimeJSON:       "text/json",
    charset:        "UTF-8"
};

var i = 0;
if ('node' === process.argv[i++]) {
    i++;
}
if (process.argv[i]) {
    var optionsPath = process.argv[i];
    if (!optionsPath.match(/^\.?\//)) {
        optionsPath = process.cwd() + '/' + optionsPath;
    }
    var cfg = require(optionsPath);
    for (var name in cfg) {
        config[name] = cfg[name];
    }
}

var server = require(config.protocol).createServer(require('./index')(config));
server.listen(config.port, config.host);

process.on('SIGTERM', function () {
    console.log('Closing server');
    server.close(function() {
        console.log('Server closed');
    });
});

console.log('Started: ' + config.protocol + '://' + config.host + ':' + config.port);
