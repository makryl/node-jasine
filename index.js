/**
 * Copyright © 2014 Maksim Krylosov <Aequiternus@gmail.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

module.exports = create;

var fs = require('fs');
var http = require('http');
var url = require('url');
var jsin = require('jsin');
var mime;

var logger;
var REQID = 0;

var config = {
    logLevel:           "info",
    error:              __dirname + "/public/",
    dirPublic:          __dirname + "/public",
    dirStatic:          __dirname + "/static",
    uriStatic:          "/static/",
    mimeDefault:        "text/html",
    mimeJSON:           "text/json",
    charset:            "utf-8"
};

function create(cfg) {
    if (cfg) {
        for (var name in cfg) {
            config[name] = cfg[name];
        }
    }

    if (config.uriStatic) {
        mime = require('mime');
    }

    logger = new (require('./logger'))(config.logLevel);

    jsin.setDirectory(config.dirPublic);
    jsin.clear();

    return router;
}

function router(req, res) {
    try {
        req.__id = ++REQID;

        var path = url.parse(req.url).pathname;

        if (config.uriStatic && path.substr(0, config.uriStatic.length) === config.uriStatic) {
            static(req, res, path.substr(config.uriStatic.length));
            return;
        }

        path = path.substr(1);

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
        fullPath = config.dirPublic + '/' + fullPath;
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
        var statusCode = parseInt(err);
        if (http.STATUS_CODES[statusCode]) {
            code = statusCode;
        } else if (err.statusCode) {
            code = err.statusCode;
        } else {
            code = 500;
        }
    }
    if (!level) {
        if (404 === code) {
            level = "warn";
        } else {
            level = "error";
        }
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
    error(req, res, '', 404);
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

function static(req, res, path) {
    path = config.dirStatic + '/' + path;
    logger.debug(req.__id, "Static: " + path);
    fs.stat(path, function(err, stats) {
        if (err) {
            if ('ENOENT' !== err.code || -1 === err.message.indexOf(path)) {
                error(req, res, err);
            } else {
                notFound(req, res);
            }
        } else {
            var ct = mime.lookup(path);
            if (ct.match(/^text\//)) {
                ct += '; charset=' + config.charset;
            }

            res.setHeader('Content-type', ct);
            res.setHeader('Content-length', stats.size);

            fs.createReadStream(path).pipe(res);

            logger.debug(req.__id, 'Static output: ' + stats.size + ' ' + ct);
            logger.info(req.__id, res.statusCode + ' ' + req.url);
        }
    });
}
