[ 'GNN', function(G) {
    var ns = this.pop();
    if (typeof G[ns] == 'undefined') G[ns] = {};

    var T = G[ns];

    var URI;
    /**
        URI.
        @class Undocumented
        @name URI
        @exports URI as GNN.URI
    */
    URI = T.URI = function URI(str) {
        if (!(this instanceof URI)) return new URI(str);

        var sch;
        if (new RegExp('^([^:]+)://').test(str)) sch = RegExp.$1;
        var uri = str.replace(new RegExp('^([^:]+)://'), '').split('/');
        var dom = uri.shift();
        var params = {};
        var last = uri.pop();
        var q = '?';
        if (last && /[=?]/.test(last)) {
            if (/^(.*?)\?(.*)$/.test(last)) {
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

        this.scheme = sch;
        this.domain = dom;
        this.local = uri;
        this.params = params;
        this.q = q;
    };

    URI.prototype = {
        data: function() {
            var params = [];
            for (var p in this.params) {
                if (typeof this.params[p] != 'undefined') {
                    if (p == '_flags') {
                        params = params.concat(this.params[p]);
                    } else {
                        var val = this.params[p];
                        var encoded = URI.encode(val+'');
                        params.push(p + '=' + (/%/.test(val) ? val : encoded));
                    }
                }
            }
            return params.join('&');
        },
        toLocalPath: function() {
            var params = this.data();
            var s = this.local.join('/');
            return '/' + (params.length ? s + this.q + params : s);
        },
        toString: function() {
            var local = this.toLocalPath();
            var s = this.domain + local;
            if (this.scheme) s = this.scheme + '://' + s;
            return s;

        }
    };
    URI.prototype.constructor = URI;

    URI.encode = function(str, unsafe) {
        var unsafe = unsafe || '[^\\w\\d]';
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
    };

    URI.location = function() {
        return new URI(location.href);
    };

    URI.params = function(args) {
        args = args || {};
        var uri = URI.location();
        for (var prop in args) uri.params[prop] = args[prop];
        return uri;
    };
} ].reverse()[0](this);
