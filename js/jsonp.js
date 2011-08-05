(function() {
    var JSONP = GNN.inherit(function(uri, obj, method) {
        return JSONP.add(uri, obj, method);
    }, {
        add: function(uri, obj, method) {
            if (typeof uri == 'string') uri = new GNN.URI(uri);

            var cb = [
                [ '%', '_' ],
                [ '-', '_' ],
                [ '\\*', '_' ],
                [ '\\.', '_' ]
            ].reduce(function(r, x) {
                return r.replace(new RegExp(x[0], 'g'), x[1]);
            }, escape(encodeURIComponent(uri+'')));
            while (JSONP.callback[cb]) cb += '_';

            uri.params['callback'] = 'GNN.JSONP.callback'+'.'+cb;
            if (typeof uri.params['timestamp'] == 'undefined') {
                uri.params['timestamp'] = encodeURI(new Date());
            }
            if (typeof(obj) == 'function' && typeof(method) == 'undefined') {
                obj = { callback: obj };
                method = 'callback';
            }

            var self = { uri: uri+'' };

            self.callback = function(args) {
                var r = obj[method].call(obj, args);
                self.done = true;
                self.stop();
                return r;
            };
            self.stop = function() {
                delete JSONP.callback[cb];
            };

            self.script = document.createElement('script');
            self.script.src = self.uri;
            self.script.type = 'text/javascript';

            JSONP.callback[cb] = self.callback;
            document.getElementsByTagName('head')[0].appendChild(self.script);

            return self;
        },
        retrieve: function(hash, callback, timeout) {
            var t = 10000;
            if (typeof hash.timeout != 'undefined') {
                t = hash.timeout;
                delete hash.timeout;
            }

            var keys = [];
            var result = {};
            for (var k in hash) keys.push(k);
            var wait = keys.concat([]);
            var timedout = false;
            var jsonp = {};

            var run = function() {
                if (keys.length > 0) {
                    var k = keys.shift();
                    jsonp[k] = new JSONP(hash[k], function(obj) {
                        result[k] = obj;
                        wait = wait.filter(function(v){return v!=k;});
                        if (!wait.length && !timedout) callback(result);
                    });
                    setTimeout(run, 0);
                }
            };
            run();

            timeout && setTimeout(function() {
                if (wait.length) {
                    timedout = true;
                    timeout(jsonp, wait);
                }
            }, t);
        },
        callback: {}
    });
    GNN.JSONP = JSONP;
})();
