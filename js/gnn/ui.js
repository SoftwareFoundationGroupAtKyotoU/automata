var UI = {};

(function(ns) {
    ns.doc = function(){ return ns.document || document; };
    ns.isNode = function(x){ return x && typeof x.nodeType === 'number'; };
    ns._$ = function(id){ return ns.doc().getElementById(id); };
    ns.$ = function(id){ return ns.isNode(id) ? id : ns._$(id); };
    ns.$text = function(str) {
        if (typeof str === 'undefined' || str === null) str = '';
        return ns.doc().createTextNode(str + '');
    };
})(UI);

module.exports = UI;
