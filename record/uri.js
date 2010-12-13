(function() {
    var URI = GNN.inherit(function(str) {
        var sch;
        if (new RegExp('^([^:]+)://').test(str)) sch = RegExp.$1;
        var uri = str.replace(new RegExp('^([^:]+)://'), '').split('/');
        var dom = uri.shift();
        var params = {};
        var last = uri.pop();
        var q = '?';
        if (last && /[=?]/.test(last)) {
            if (/^(.*)\?(.*)$/.test(last)) {
                uri.push(RegExp.$1);
                last = RegExp.$2;
            }
            last.split(/&/).forEach(function(v) {
                if (/^([^=]+)=(.*)$/.test(v)) {
                    params[RegExp.$1] = RegExp.$2;
                } else {
                    params['_flags'] = params['_flags'] || [];
                    params['_flags'].push(v);
                }
            });
        } else {
            uri.push(last)
        }
        var self = {
            scheme: sch,
            domain: dom,
            local: uri,
            params: params,
            q: q
        };
        self.toLocalPath = function() {
            params = [];
            for (var p in self.params) {
                if (typeof self.params[p] != 'undefined') {
                    if (p == '_flags') {
                        params += self.params[p];
                    } else {
                        var val = self.params[p];
                        var encoded = URI.encode(val+'');
                        params.push(p + '=' + (/%/.test(val) ? val : encoded));
                    }
                }
            }
            var s = self.local.join('/');
            params = params.join('&');
            return '/' + (params.length ? s + self.q + params : s);
        };
        self.toString = function() {
            var local = self.toLocalPath();
            var s = self.domain + local;
            if (self.scheme) s = self.scheme + '://' + s;
            return s;
        };
        return self;
    }, {
        encode: function(str/*, unsafe*/) {
            var unsafe = arguments[1] || '[^\\w\\d]';
            var s = '';
            var len = str.length;
            for (var i=0; i < len; i++) {
                var ch = str.charAt(i);
                var code = str.charCodeAt(i);
                if (!new RegExp('^'+unsafe+'$').test(ch) || ch > 0xff) {
                    s += ch;
                } else {
                    s += '%'+code.toString(16);
                }
            }
            return s;
        },
        location: function() {
            return new URI(location.href);
        },
        params: function(args) {
            args = args || {};
            var uri = URI.location();
            for (var prop in args) uri.params[prop] = args[prop];
            return uri;
        }
    });
    GNN.URI = URI;
})();
