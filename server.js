#!/usr/bin/env node

/**
 * Copyright © 2014 Maksim Krylosov <Aequiternus@gmail.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var fs = require('fs');
var jasine = require('./index');

var config = {
    protocol:           "http",
    host:               "localhost",
    port:               8008,
    socket:             null
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
    var cfg = JSON.parse(fs.readFileSync(optionsPath));
    for (var name in cfg) {
        config[name] = cfg[name];
    }
}

var server = require(config.protocol).createServer(jasine(config));
if (config.socket) {
    server.listen(config.socket);
} else {
    server.listen(config.port, config.host);
}

var sockets = [];
server.on('connection', function(socket) {
    sockets.push(socket);
    socket.on('close', function() {
        sockets.splice(sockets.indexOf(socket), 1);
    });
});

process.on('SIGTERM', function() {
    console.log('Closing server');
    server.close(function() {
        console.log('Server closed');
    });
    sockets.forEach(function(socket) {
        socket.destroy();
    });
});

process.on('SIGHUP', function() {
    try {
        console.log('Reloading server');
        var cfg = JSON.parse(fs.readFileSync(optionsPath));
        for (var name in cfg) {
            config[name] = cfg[name];
        }
        jasine(config);
        console.log('Server reloaded');
    } catch (err) {
        console.log(err);
    }
});

console.log('Started: ' + config.protocol + '://' + config.host + ':' + config.port);
