/**
 * Copyright © 2014 Maksim Krylosov <Aequiternus@gmail.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

module.exports = logger;

function logger(level) {
    this.levels = levels = {
        error: 1,
        warn:  2,
        info:  3,
        debug: 4
    };
    this.level = this.levels[level || "warn"];
}

logger.prototype.log = function(level, reqId, message) {
    if (this.levels[level] <= this.level) {
        console[level === "debug" ? "error" : level](
            "%s [%d] [%s] %s",
            (new Date()).toISOString(),
            reqId || 0,
            level,
            message
        );
        if ( 4 === this.level && this.levels[level] <3 ) {
            console.trace();
        }
    }
};

logger.prototype.debug = function(reqId, message) {
    this.log("debug", reqId, message);
};

logger.prototype.info = function(reqId, message) {
    this.log("info", reqId, message);
};

logger.prototype.warn = function(reqId, message) {
    this.log("warn", reqId, message);
};

logger.prototype.error = function(reqId, message) {
    this.log("error", reqId, message);
};
