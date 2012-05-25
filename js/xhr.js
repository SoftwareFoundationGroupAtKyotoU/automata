[ 'GNN', function(G) {
    var ns = this.pop();
    if (typeof G[ns] == 'undefined') G[ns] = {};

    var T = G[ns];
    var URI = T.URI;

    var XHR;
    /**
        XML HTTP request method.
        @class Undocumented
        @name XHR
        @exports XHR as GNN.XHR
    */
    XHR = T.XHR = function(uri, callback, error) {
        return XHR.get(uri, callback, error);
    };

    XHR.callback = {};

    var add = function(method, alt, uri, callback, error) {
        if (!(uri instanceof URI)) uri = new URI(uri+'');
        callback = callback || function(){};
        error = error || function(){};

        var self = { uri: uri+'' };
        self.callback = function() {
            var r = callback.apply(null, arguments);
            self.done = true;
            self.stop();
            return r;
        };
        self.error = function() {
            var r = error.apply(null, arguments);
            self.done = true;
            self.stop();
            return r;
        };

        if (typeof uri.params['timestamp'] == 'undefined') {
            uri.params['timestamp'] = encodeURI(new Date());
        }

        if (!alt(self, uri)) {
            var req = new XMLHttpRequest();
            self.req = req;
            self.stop = function() {
                self.callback = function(){};
                self.error = function(){};
            };

            var data = null;
            if (method == 'POST') {
                data = uri.data();
                uri.params = {};
            }

            req.open(method, uri+'');
            req.onreadystatechange = function(e) {
                if (req.readyState == 4) {
                    if (200 <= req.status && req.status < 300) {
                        self.callback(req);
                    } else {
                        self.error(req);
                    }
                }
            }
            req.send(data);
        }

        return self;
    };

    var retrieve = function(method, hash, callback, error) {
        var t = 10000;
        if (typeof hash.timeout != 'undefined') {
            t = hash.timeout;
            delete hash.timeout;
        }

        var asyncCallback = function(){};
        if (typeof hash.async == 'object' ) {
            var async = hash.async;
            var done = {};
            delete hash.async;
            for (var x in async) async[x].done = false;

            asyncCallback = function(w, r) {
                for (var x in async) {
                    var ks = async[x].keys || [ x ];
                    if (!done[x] &&
                        ks.every(function(k){ return w.indexOf(k)<0; })) {
                        done[x] = true;
                        var callback = async[x].callback || async[x];
                        if (typeof callback == 'function') callback(r);
                    }
                }
            };
        }
        callback = callback || function(){};

        var keys = [];
        var result = {};
        var timedout = false;
        var xhr = {};

        for (var k in hash) keys.push(k);
        var wait = keys.concat([]);

        var run = function() {
            if (keys.length > 0) {
                var k = keys.shift();
                xhr[k] = XHR[method](hash[k], function(obj) {
                    result[k] = obj;
                    wait = wait.filter(function(v){return v!=k;});
                    asyncCallback(wait, result);
                    if (!wait.length && !timedout) callback(result);
                });
                setTimeout(run, 0);
            }
        };
        run();

        error && setTimeout(function() {
            if (wait.length) {
                keys = [];
                timedout = true;
                wait.forEach(function(k){ xhr[k] && xhr[k].stop(); });
                error(xhr, wait);
            }
        }, t);

        return { stop: function() {
            while (wait.length > 0) xhr[wait.shift()].stop();
        } };
    };

    XHR.get = function(uri, callback, error) {
        return add('GET', function(){return false;}, uri, callback, error);
    };

    XHR.post = function(uri, callback, error) {
        return add('POST', function(){return false;}, uri, callback, error);
    };

    XHR.retrieve = function(hash, callback, error) {
        return retrieve('get', hash, callback, error);
    };

    var alt = function(self, uri) { // JSONP
        var cb = [
            [ '%', '_' ],
            [ '-', '_' ],
            [ '\\*', '_' ],
            [ '\\.', '_' ]
        ].reduce(function(r, x) {
            return r.replace(new RegExp(x[0], 'g'), x[1]);
        }, escape(encodeURIComponent(self.uri)));
        while (XHR.callback[cb]) cb += '_';

        self.stop = function() {
            delete XHR.callback[cb];
        };
        XHR.callback[cb] = self.callback;
        uri.params['callback'] = [ ns, 'XHR.callback', cb ].join('.');

        self.script = document.createElement('script');
        self.script.src = uri+'';
        self.script.type = 'text/javascript';

        var head = document.getElementsByTagName('head')[0];
        head.appendChild(self.script);

        return true;
    };

    XHR.json = function(uri, callback, error) {
        var jsonp = alt;
        if (typeof XMLHttpRequest != 'undefined' &&
            typeof JSON != 'undefined') {
            jsonp = function(){ return false; };
            var cb = callback || function(){};
            error = error || function(){};
            callback = function(req) {
                var obj;
                try {
                    obj = JSON.parse(req.responseText);
                } catch (e) {
                    error(req);
                }
                cb(obj);
            };
        }

        return add('GET', jsonp, uri, callback, error);
    };

    XHR.json.retrieve = function(hash, callback, error) {
        return retrieve('json', hash, callback, error);
    };

    XHR.jsonp = function(uri, callback, error) {
        return add('GET', alt, uri, callback, error);
    };

    XHR.jsonp.retrieve = function(hash, callback, error) {
        return retrieve('jsonp', hash, callback, error);
    };
} ].reverse()[0](this);
