/**
 * Copyright © 2014 Maksim Krylosov <Aequiternus@gmail.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

module.exports = create;

var fs = require('fs');
var url = require('url');
var jsin = require('jsin');

var config;
var logger;
var REQID = 0;

function create(cfg) {
    config = cfg;

    logger = new (require('./logger'))(config.logLevel);
    jsin.setDirectory(config.directory);

    return router;
}

function router(req, res) {
    try {
        req.__id = ++REQID;

        var path = url.parse(req.url).pathname.substr(1);

        var json = path.match(/\.json$/);
        if (json) {
            path = path.substr(0, path.length - 5);
        }

        res.statusCode = 200;
        res.setHeader(
            'Content-type',
            (json ? config.mimeJSON : config.mimeDefault)
                + '; charset=' + config.charset
        );

        controller(req, res, path, json);
    } catch (err) {
        error(req, res, err);
    }
}

function controller(req, res, path, json) {
    if (path.match(/(^$|\/$)/)) {
        path += 'index';
    }
    logger.debug(req.__id, "Path: " + path);

    var fullPath = path;
    if (!path.match(/^\.?\//)) {
        fullPath = config.directory + '/' + fullPath;
    }
    logger.debug(req.__id, "Module: " + fullPath);

    try {
        require(fullPath)(req, res, function(err, tpl, data) {
            try {
                if (err) throw err;
                logger.debug(req.__id, "Data received");
                if ('undefined' === typeof data) {
                    data = tpl;
                    tpl = null;
                }
                if (json) {
                    outputJSON(req, res, data);
                } else {
                    template(req, res, true, tpl || path, data);
                }
            } catch (err) {
                error(req, res, err);
            }
        });
    } catch (err) {
        if ('MODULE_NOT_FOUND' === err.code && -1 !== err.message.indexOf(fullPath)) {
            logger.debug(req.__id, "Module not found");
            if (json) {
                notFound(req, res);
            } else {
                template(req, res, false, path);
            }
        } else {
            throw err;
        }
    }
}

function error(req, res, err, code, level) {
    if (!code) {
        code = 500;
    }
    if (!level) {
        level = "error";
    }

    logger.log(level, req.__id, code + ' ' + req.url + ' ' + err);

    res.statusCode = code;
    res.setHeader(
        'Content-type',
        config.mimeDefault + '; charset=' + config.charset
    );

    if (res.__hasError) {
        res.end();
    } else {
        res.__hasError = true;
        if (config['error' + code]) {
            controller(req, res, config['error' + code]);
        } else {
            controller(req, res, config.error);
        }
    }
}

function notFound(req, res) {
    error(req, res, '', 404, "warn");
}

function template(req, res, need, path, data) {
    logger.debug(req.__id, "JSIN: " + path);
    jsin.include(path, data || {}, function(err, out) {
        if (err) {
            if (need || 'ENOENT' !== err.code || -1 === err.message.indexOf(path)) {
                error(req, res, err);
            } else {
                notFound(req, res);
            }
        } else {
            outputJSIN(req, res, out);
        }
    });
}

function outputJSON(req, res, data) {
    res.end(JSON.stringify(data));
    logger.debug(req.__id, "JSON output");
    logger.info(req.__id, res.statusCode + ' ' + req.url);
}

function outputJSIN(req, res, out) {
    res.end(out);
    if (!res.__hasError) {
        logger.debug(req.__id, "JSIN output");
        logger.info(req.__id, res.statusCode + ' ' + req.url);
    }
}
