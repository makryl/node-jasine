/**
 * Copyright © 2014 Maksim Krylosov <Aequiternus@gmail.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var config;

var i = 0;
if ('node' === process.argv[i++]) {
    i++;
}
if (process.argv[i]) {
    var optionsPath = process.argv[i];
    if (!optionsPath.match(/^\.?\//)) {
        optionsPath = process.cwd() + '/' + optionsPath;
    }
    config = require(optionsPath);
} else {
    config = require('./config.json');
}

require(config.protocol)
    .createServer(require('./index')(config))
    .listen(config.port, config.host);

console.log('Started: ' + config.protocol + '://' + config.host + ':' + config.port)
