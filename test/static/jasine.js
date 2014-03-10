(function(w){

    if (!w.jasine) {
        w.jasine = {
            init: init,
            load: load
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
        initElement(document.body);
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
        var links = element.querySelectorAll('a[href^="/"],*[data-href^="/"]');
        for (var i = 0, l = links.length; i < l; i++) {
            links[i].addEventListener('click', open, false);
        }
        var forms = element.querySelectorAll('form[action^="/"],form[data-action^="/"],form:not([action])');
        for (var i = 0, l = forms.length; i < l; i++) {
            if (!forms[i].getAttribute('enctype')) {
                forms[i].addEventListener('submit', submit, false);
            }
        }
    }

    function popstate(event) {
        if (event.state && event.state.jasine) {
            var j = event.state.jasine;
            var element = document.querySelector(j.element);
            if (element) {
                load(element, j.url, null, j.excludeLayout);
            } else {
                location.reload();
            }
        }
    }

    function open(event) {
        event.preventDefault();

        var hrefAttr = this.getAttribute('href');
        var href = this.getAttribute('data-href') || hrefAttr;
        var elementQuery = this.getAttribute('data-element')
            || (hrefAttr && '#' === hrefAttr[0] ? hrefAttr : options.element);
        var element = document.querySelector(elementQuery);
        var excludeLayout = this.getAttribute('data-exclude-layout') || options.excludeLayout;

        load(element, href, null, excludeLayout);

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

    function submit(event) {
        event.preventDefault();

        var actionAttr = this.getAttribute('action');
        var action = this.getAttribute('data-action') || actionAttr || location.toString();
        var elementQuery = this.getAttribute('data-element')
            || (actionAttr && '#' === actionAttr[0] ? actionAttr : options.element);
        var element = document.querySelector(elementQuery);
        var excludeLayout = this.getAttribute('data-exclude-layout') || options.excludeLayout;

        var form = event.target;
        var formElements = form.elements;
        var data = '';
        for (var i = 0, l = formElements.length; i < l; i++) {
            var e = formElements[i];
            if (!e.name && !e.id) {
                continue;
            }

            var v = '';
            if ('select' === e.tagName.toLowerCase()) {
                v = e.options[e.selectedIndex].value;
            } else if (e.type && e.type.match(/^(checkbox|radio)$/i)) {
                if (e.checked) {
                    v = e.value || 'on';
                } else {
                    continue;
                }
            } else {
                v = e.value;
            }

            if (i > 0) {
                data += '&';
            }
            data += encodeURIComponent(e.name || e.id) + '=' + encodeURIComponent(v);
        }

        var get = !form.method || 'get' === form.method.toLowerCase();
        if (get) {
            action = action.replace(/\?.*$/, '') + '?' + data;
            data = null;
        }

        load(element, action, data, excludeLayout);

        if (get && (!actionAttr || '#' !== actionAttr[0])) {
            if (w.history && w.history.pushState) {
                history.pushState({
                    jasine: {
                        url: action,
                        element: elementQuery,
                        excludeLayout: excludeLayout
                    }
                }, document.title, action);
            }
        }
    }

    function load(element, url, postData, excludeLayout) {
        var a = document.createElement('a');
        a.href = url;
        var path = a.pathname.substr(1);
        if (path.match(/(^$|\/$)/)) {
            path += 'index';
            a.pathname += 'index';
        }
        a.pathname += '.json';
        fire(element, 'elementbeforeload', true, true);
        request(a.href, postData, function(err, req) {
            if (err) {
                console.error(req);
                console.error(err);
                fire(element, 'error', true, true);
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
                fire(element, 'elementload', true, true);
            }
        });
    }

    function request(url, postData, callback) {
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
            req.send(postData);
        } else {
            req.open('GET', url, true);
            req.send();
        }
    }

    function fire(target, event, bubbles, cancelable) {
        var evt = document.createEvent('Event');
        evt.initEvent(event, bubbles, cancelable);
        target.dispatchEvent(evt);
    }

})(window);
