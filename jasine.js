(function(w){

    if (!w.jasine) {
        w.jasine = {
            init: init
        };
    }

    var options = {
        element: 'body',
        excludeLayout: 'layout'
    };

    function init(opts) {
        for (var i in opts) {
            options[i] = opts[i];
        }
        initElement(document.querySelector(options.element));
        addEventListener('popstate', popstate, false);

        if (w.history && w.history.replaceState) {
            history.replaceState({
                jasine: {
                    url: location.toString(),
                    element: options.element,
                    excludeLayout: options.excludeLayout
                }
            }, document.title, location);
        }
    }

    function initElement(element) {
        var els = element.querySelectorAll('a[href^="/"],*[data-href^="/"]');
        for (var i = 0, l = els.length; i < l; i++) {
            els[i].addEventListener('click', open, false);
        }
    }

    function popstate(event) {
        if (event.state && event.state.jasine) {
            var j = event.state.jasine;
            var element = document.querySelector(j.element);
            if (element) {
                loadElement(element, j.url, null, j.excludeLayout);
            } else {
                location.reload();
            }
        }
    }

    function open(event) {
        event.preventDefault();

        var hrefAttr = this.getAttribute('href');
        var href = this.getAttribute('data-href') || hrefAttr;
        var elementQuery = this.getAttribute('data-element') || ('#' === hrefAttr[0] ? hrefAttr : options.element);
        var element = document.querySelector(elementQuery);
        var excludeLayout = this.getAttribute('data-exclude-layout') || options.excludeLayout;

        loadElement(element, href, null, excludeLayout);

        if (hrefAttr && '#' !== hrefAttr[0]) {
            if (w.history && w.history.pushState) {
                history.pushState({
                    jasine: {
                        url: href,
                        element: elementQuery,
                        excludeLayout: excludeLayout
                    }
                }, document.title, href);
            }
        }
    }

    function loadElement(element, url, postData, excludeLayout) {
        var a = document.createElement('a');
        a.href = url;
        var hash = '#!' + a.pathname;
        var path = a.pathname.substr(1);
        if (path.match(/(^$|\/$)/)) {
            path += 'index';
            a.pathname += 'index';
        }
        a.pathname += '.json';
        load(a.href, postData, function(err, req) {
            if (err) {
                console.error(req);
                console.error(err);
            } else {
                var data = JSON.parse(req.responseText);
                if (excludeLayout) {
                    if (!data.excludeLayout) {
                        data.excludeLayout = [];
                    }
                    if ('string' === typeof excludeLayout) {
                        excludeLayout = excludeLayout.split(/,\s*/);
                    }
                    for (var i = 0, l = excludeLayout.length; i < l; i++) {
                        data.excludeLayout.push(excludeLayout[i]);
                    }
                }

                element.innerHTML = jsin.include(data.template || path, data);
                initElement(element);
            }
        });
    }

    function load(url, postData, callback) {
        console.info(url);

        if ('function' === typeof postData) {
            callback = postData;
            postData = null;
        }

        var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            try {
                if (req.readyState === 4) {
                    if (req.status === 200) {
                        callback(null, req);
                    } else {
                        throw new Error('Request status code: ' + req.status);
                    }
                }
            } catch (err) {
                callback(err, req);
            }
        };
        if (postData) {
            req.open('POST', url, true);
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            req.send(postData);
        } else {
            req.open('GET', url, true);
            req.send();
        }
    }

})(window);
