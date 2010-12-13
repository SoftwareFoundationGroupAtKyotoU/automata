if (typeof GNN == 'undefined') var GNN={};
(function() {
    var override = function(obj, by) {
        by = by||{};
        for (prop in by) {
            if (obj[prop] === null
                || typeof by[prop] != 'object'
                || typeof obj[prop] != 'object') {
                obj[prop] = by[prop];
            } else {
                override(obj[prop], by[prop]);
            }
        }
        return obj;
    };
    GNN.override = override;

    var inherit = function(child, parent) {
        var obj = child || {};
        for (var prop in parent) {
            if (typeof obj[prop] == 'undefined') {
                obj[prop] = parent[prop];
            }
        }
        return obj;
    };
    GNN.inherit = inherit;

    var forEach = function(hash, f){ for (var p in hash) f(p, hash[p]); };
    var merge = function() {
        var hash = {}; var args=[]; args.push.apply(args, arguments);
        args.forEach(function(arg) { forEach(arg, function(k,x) {
            if (typeof hash[k] == 'undefined') hash[k] = x;
        }); });
        return hash;
    };

    GNN.Hash = GNN.Hash || {};
    GNN.Hash.forEach = forEach;
    GNN.Hash.merge = merge;
})();
