/**
 * Copyright © 2014 Maksim Krylosov <Aequiternus@gmail.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var fs = require('fs');
var http = require('http');
var url = require('url');
var jsin = require('jsin');
var mime;

exports.create = create;
exports.logger = logger;
exports.jsin = jsin;

var log;
var REQID = 0;

var config = exports.config = {
    "logLevel":         "info", // debug, info, warn, error
    "init":             null, // Module required before server starts (main application module)
    "error":            __dirname + "/public/", // Universal controller for all errors
    // Use errorXXX for specified error code.
    // Example: "error404": "/path/to/error404" will look for /path/to/error404.js and/or /path/to/error404.jsin.
    "dirRoot":          __dirname, // Should be overridden
    "dirPublic":        "public", // Where controllers and templates located
    "dirStatic":        "static", // Where static files located
    "uriStatic":        "/static/", // URL prefix for static files
    "mimeDefault":      "text/html",
    "mimeJSON":         "text/json",
    "charset":          "utf-8"
};

function create(cfg) {
    if (cfg) {
        for (var name in cfg) {
            config[name] = cfg[name];
        }
    }

    if (!config.dirRoot) {
        config.dirRoot = process.cwd();
    } else if (!config.dirRoot.match(/^\.?\//)) {
        config.dirRoot = process.cwd() + '/' + config.dirRoot;
    }
    process.chdir(config.dirRoot);

    for (var name in config) {
        if (name.match(/^(dirPublic$|dirStatic$|error)/) && !config[name].match(/^\.?\//)) {
            config[name] = config.dirRoot + '/' + config[name];
        }
    }

    log = new (require('./logger'))(config.logLevel);

    if (config.init) {
        if (!config.init.match(/^\.?\//)) {
            config.init = config.dirRoot + '/' + config.init;
        }
        require(config.init);
    }

    if (config.uriStatic) {
        mime = require('mime');
    }

    jsin.setDirectory(config.dirPublic);
    jsin.clear();

    return router;
}

function logger() {
    return log;
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
    log.debug(req.__id, "Path: " + path);

    function controllerCallback(err, data) {
        try {
            if (err) throw err;
            log.debug(req.__id, "Data received");
            if (json) {
                outputJSON(req, res, data);
            } else {
                template(req, res, data.template || path, data);
            }
        } catch (err) {
            error(req, res, err);
        }
    }

    function noController() {
        if (json) {
            notFound(req, res);
        } else {
            template(req, res, path);
        }
    }

    var fullPath = path;
    if (!path.match(/^\.?\//)) {
        fullPath = config.dirPublic + '/' + fullPath;
    }

    var p = fullPath.lastIndexOf('/') + 1;
    var dirName = fullPath.substr(0, p);
    var baseName = fullPath.substr(p);

    try {
        var module = require(fullPath + '.js');
        log.debug(req.__id, "Module: " + fullPath);
        if ('function' === typeof module) {
            module(req, res, controllerCallback);
        } else if ('index' === baseName && module.index) {
            log.debug(req.__id, "Method: index");
            module.index(req, res, controllerCallback);
        } else {
            log.debug(req.__id, "Method nod found: index");
            noController();
        }
    } catch (err) {
        if ('MODULE_NOT_FOUND' === err.code && -1 !== err.message.indexOf(fullPath)) {
            log.debug(req.__id, "Module not found: " + fullPath);
            fullPath = dirName + 'index';
            try {
                var module = require(fullPath + '.js');
                log.debug(req.__id, "Module: " + fullPath);
                if (module[baseName]) {
                    log.debug(req.__id, "Method: " + baseName);
                    module[baseName](req, res, controllerCallback);
                } else if (module.router) {
                    log.debug(req.__id, "Module router");
                    module.router(req, res, baseName, controllerCallback);
                } else {
                    log.debug(req.__id, "Method nod found: " + baseName);
                    noController();
                }
            } catch (err) {
                if ('MODULE_NOT_FOUND' === err.code && -1 !== err.message.indexOf(fullPath)) {
                    log.debug(req.__id, "Module not found: " + fullPath);
                    noController();
                } else {
                    throw err;
                }
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

    log.log(level, req.__id, code + ' ' + remoteAddress(req) + ' ' + req.url + ' ' + err);

    res.statusCode = code;
    if (!res.headersSent) {
        res.setHeader(
            'Content-type',
            config.mimeDefault + '; charset=' + config.charset
        );
    }

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

function template(req, res, path, data) {
    log.debug(req.__id, "JSIN: " + path);
    jsin.include(path, data || {}, function(err, out) {
        if (err) {
            if ('ENOENT' !== err.code || -1 === err.message.indexOf(path)) {
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
    log.debug(req.__id, "JSON output");
    log.info(req.__id, res.statusCode + ' ' + remoteAddress(req) + ' ' + req.url);
}

function outputJSIN(req, res, out) {
    res.end(out);
    if (!res.__hasError) {
        log.debug(req.__id, "JSIN output");
        log.info(req.__id, res.statusCode + ' ' + remoteAddress(req) + ' ' + req.url);
    }
}

function static(req, res, path) {
    path = config.dirStatic + '/' + path;
    log.debug(req.__id, "Static: " + path);
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

            log.debug(req.__id, 'Static output: ' + stats.size + ' ' + ct);
            log.info(req.__id, res.statusCode + ' ' + remoteAddress(req) + ' ' + req.url);
        }
    });
}

function remoteAddress(req) {
    return req.headers['x-forwarded-for']
        || req.connection.remoteAddress;
}
