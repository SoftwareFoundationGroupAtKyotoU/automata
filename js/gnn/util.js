if (typeof GNN == 'undefined') var GNN={};
(function() {
    var override = function(obj, by) {
        by = by||{};
        for (var prop in by) {
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
})();
