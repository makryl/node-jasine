/**
 * Copyright © 2014 Maksim Krylosov <Aequiternus@gmail.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */


var fs = require('fs');
var cluster = require('cluster');
var jasine = require('./index');

var config = {
    "protocol":         "http", // http or https
    "host":             "localhost",
    "port":             8008,
    "socket":           null, // UNIX socket instead of host and port
    "workers":          null, // Default: count of CPUs
    "group":            null, // Default: nobody. Works under root only.
    "user":             null, // Default: nobody. Works under root only.
    "daemon":           false, // In most cases you should set it to TRUE, don't forget to set "pid" and "log" also
    "pid":              null, // Required for stop, reload and kill commands
    "log":              null,
    "logError":         null // Default: same as "log"
};

var configPath = process.argv[2] || process.env.CONFIG;
if (configPath) {
    if (!configPath.match(/^\.?\//)) {
        configPath = process.cwd() + '/' + configPath;
    }
    var cfg = JSON.parse(fs.readFileSync(configPath));
    for (var name in cfg) {
        config[name] = cfg[name];
    }
}

var c = process.argv[3];
if (c) {
    switch (c) {
        case "reload":  ctlsig('SIGHUP');               break;
        case "stop":    ctlsig('SIGTERM', true);        break;
        case "kill":    ctlsig('SIGINT', true, true);   break;
        default: console.log('Unknown command ' + c);   break;
    }
} else {
    if (cluster.isMaster) {
        if (!config.workers) {
            config.workers = require('os').cpus().length;
        }
        if (!config.group) {
            config.group = 'nobody';
        }
        if (!config.user) {
            config.user = 'nobody';
        }

        if (config.daemon) {
            var stdout;
            var stderr;
            if (config.log) {
                stdout = fs.openSync(config.log, 'a');
                if (!config.logError) {
                    stderr = fs.openSync(config.log, 'a');
                }
            }
            if (config.logError) {
                stderr = fs.openSync(config.logError, 'a');
            }
            require('daemon')({
                stdout: stdout,
                stderr: stderr
            });
        }

        if (config.pid) {
            try {
                fs.writeFileSync(config.pid, process.pid, {flag: 'wx', mode: 0600});
            } catch (err) {
                console.log('Can not write PID file');
                process.exit(1);
            }
            process.on('exit', function() {
                fs.unlinkSync(config.pid);
            });
        }

        process.on('SIGHUP', function () {
            console.log('Reloading...');
            var workersToClose = {};
            for (var id in cluster.workers) {
                workersToClose[id] = cluster.workers[id];
            }
            createWorkers();
            closeWorkers(workersToClose);
        });

        process.on('SIGTERM', function () {
            console.log('Terminating...');
            closeWorkers();
        });

        cluster.on('exit', function(worker, code, signal) {
            if (true === worker.suicide) {
                console.log('Worker %d closed (%s)', worker.process.pid, signal || code);
            } else {
                console.log('Worker %d died (%s). restarting...', worker.process.pid, signal || code);
                cluster.fork({CONFIG: configPath});
            }
        });

        createWorkers();

        console.log('Master ' + process.pid + ' started: ' + config.protocol + '://' + config.host + ':' + config.port);
    } else {
        try {
            if (process.getgid() === 0) {
                if (config.group) {
                    process.setgid(config.group);
                }
                if (config.user) {
                    process.setuid(config.user);
                }
            }

            var server = require(config.protocol).createServer(jasine.create(config));

            var sockets = [];
            server.on('connection', function(socket) {
                sockets.push(socket);
                socket.on('close', function() {
                    sockets.splice(sockets.indexOf(socket), 1);
                });
            });
            server.on('error', function(err) {
                console.log(err);
            });

            process.on('SIGTERM', function() {
                cluster.worker.disconnect();
                sockets.forEach(function(socket) {
                    socket.setTimeout(1000);
                });
            });

            if (config.socket) {
                server.listen(config.socket);
            } else {
                server.listen(config.port, config.host);
            }

            console.log('Worker %d started', cluster.worker.process.pid);
        } catch (err) {
            console.log(err);
        }
    }
}

function createWorkers() {
    for (var i = 0; i < config.workers; i++) {
        cluster.fork({CONFIG: configPath});
    }
}

function closeWorkers(workersToClose) {
    for (var id in workersToClose || cluster.workers) {
        cluster.workers[id].process.kill();
    }
}

function ctlsig(signal, needCheck, needDeletePid) {
    if (config.pid) {
        try {
            var pid = fs.readFileSync(config.pid);
        } catch (err) {
            console.error('Can not read PID file');
        }
        if (pid) {
            try {
                process.kill(pid, signal);
                console.log('Signal ' + signal + ' sent to ' + pid);
                if (needCheck) {
                    var timer = setInterval(function() {
                        try {
                            process.kill(pid, 0);
                        } catch (err) {
                            clearInterval(timer);
                            console.log('Terminated');
                        }
                    }, 200);
                }
                if (needDeletePid) {
                    fs.unlink(config.pid, function(err) {
                        if (err) {
                            console.log('Can not delete PID file');
                        }
                    });
                }
            } catch (err) {
                console.error('Can not send signal to ' + pid);
            }
        }
    }
}
