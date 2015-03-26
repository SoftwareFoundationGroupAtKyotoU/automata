var forEach = function(hash, f){ for (var p in hash) f(p, hash[p]); };
var merge = function() {
    var hash = {};
    var args = [];
    args.push.apply(args, arguments);
    args.forEach(function(arg) {
        forEach(arg, function(k, x) {
            if (typeof hash[k] === 'undefined') hash[k] = x;
        });
    });
    return hash;
};

module.exports = {
    forEach: forEach,
    merge: merge
};
