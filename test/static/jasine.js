(function(w){

    if (!w.jasine) {
        w.jasine = {
            init: init
        };
    }

    var options = {
        element: 'body',
        excludeLayout: ['layout']
    };

    function init(opts) {
        for (var i in opts) {
            options[i] = opts[i];
        }
        initElement(document.querySelector(options.element));
    }

    function initElement(element) {
        var els = element.querySelectorAll('a[href^="/"],*[data-href^="/"]');
        for (var i = 0, l = els.length; i < l; i++) {
            els[i].addEventListener('click', open, false);
        }
    }

    function open(event) {
        event.preventDefault();

        var hrefAttr = this.getAttribute('href');
        var href = this.getAttribute('data-href') || hrefAttr;

        var elementQuery = this.getAttribute('data-element');
        var element = document.querySelector(elementQuery || ('#' === hrefAttr[0] ? hrefAttr : options.element));

        var excludeLayoutStr = this.getAttribute('data-exclude-layout');
        var excludeLayout = excludeLayoutStr ? excludeLayoutStr.split(/,\s*/) : options.excludeLayout;

        loadElement(element, href, null, excludeLayout);
    }

    function loadElement(element, url, postData, excludeLayout) {
        var a = document.createElement('a');
        a.href = url;
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
                    data.excludeLayout = excludeLayout;
                }
                element.innerHTML = jsin.include(path, data);
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
