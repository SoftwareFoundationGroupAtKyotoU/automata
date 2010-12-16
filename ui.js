if (typeof GNN.UI == 'undefined') GNN.UI = {};

(function(ns) {
    var forEach = GNN.Hash.forEach;
    ns.doc = function(){ return ns.document || document; };
    ns.isNode = function(x){ return x && typeof x.nodeType == 'number'; };
    ns.text = function(node){ return node.textContent||node.innerText||''; };
    ns._$ = function(id){ return ns.doc().getElementById(id); };
    ns.$ = function(id){ return ns.isNode(id) ? id : ns._$(id); };
    ns.$new = function(tag, args) {
        var elm = ns.doc().createElement(tag);
        args = args || {};
        if (args.id) elm.id = args.id;
        if (args.klass) elm.className = args.klass;
        forEach(args.style||{}, function(k,s){ elm.style[k] = s });
        if (args.attr) {
            for (var attr in args.attr) {
                elm.setAttribute(attr, args.attr[attr]);
            }
        }
        if (args.child) {
            if (!(args.child instanceof Array)) args.child = [ args.child ];
            for (var i=0; i < args.child.length; i++) {
                var child = ns.$node(args.child[i]);
                elm.appendChild(child);
            }
        }
        return elm;
    };
    ns.$text = function(str){ return ns.doc().createTextNode(str); };
    ns.$node = function(x){ return ns.isNode(x) ? x : ns.$text(x); };
    ns.removeAllChildren = function(node) {
        while (node.firstChild) node.removeChild(node.firstChild);
    };
    ns.replaceLastChild = function(node, child) {
        var last = node.lastChild;
        if (last) node.removeChild(last);
        node.appendChild(child);
    };
    ns.insertText = function(node, text) {
        var start = node.selectionStart;
        var end = node.selectionEnd;
        if (typeof start == 'number' && typeof end == 'number') {
            var before = node.value.substring(0, start);
            var after = node.value.substring(end);
            node.value = before + text + after;
            node.selectionStart = node.selectionEnd = start+text.length;
        } else {
            node.value += text;
        }
    };
    ns.getStyle = function(node, name) {
        var style = (node.style||{})[name];
        if (!style) {
            var dv = ns.doc().defaultView || {};
            if (dv.getComputedStyle) { try {
                var styles = dv.getComputedStyle(node, null);
                name = name.replace(/([A-Z])/g, '-$1').toLowerCase();
                style = styles ? styles.getPropertyValue(name) : null;
            } catch(e) {
                return null;
            } } else if (node.currentStyle) {
                style = node.currentStyle[name];
            }
        }
        return style;
    };
    ns.getPosition = function(node) {
        var pos = { x:0, y:0 };
        do {
            pos.x += node.offsetLeft;
            pos.y += node.offsetTop;
        } while (node = node.offsetParent);
        return pos;
    };
    ns.getMousePosition = function(pos) {
        if (navigator.userAgent.indexOf('Chrome/') != -1 &&
            navigator.userAgent.indexOf('Safari') > -1 &&
            navigator.userAgent.indexOf('Version/' < 0)) {
            return { x: pos.clientX, y: pos.clientY };
        } else {
            var scroll = {}; var de = ns.doc().documentElement;
            if (window.innerWidth) {
                scroll.x = window.pageXOffset;
                scroll.y = window.pageYOffset;
            } else if (de && de.clientWidth) {
                scroll.x = de.scrollLeft;
                scroll.y = de.scrollTop;
            } else if (ns.doc().body.clientWidth) {
                scroll.x = ns.doc().body.scrollLeft;
                scroll.y = ns.doc().body.scrollTop;
            }
            return { x: pos.clientX + scroll.x, y: pos.clientY + scroll.y };
        }
    };
    ns.Event = function(e) {
        var self = { event: e };
        self.mousePos = function(){ return ns.getMousePosition(self.event); };
        self.stop = function() {
            if (self.event.stopPropagation) {
                self.event.stopPropagation();
                self.event.preventDefault();
            } else {
                self.event.cancelBubble = true;
                self.event.returnValue = false;
            }
        };
        return self;
    };
    ns.Observer = function(node, event, obj, m) {
        var self = { node: node, event: event };
        var fun = obj;
        if (typeof m == 'string') {
            fun = obj[m];
        } else if (typeof m != 'undefined') {
            fun = m;
        }
        var callback = function(e){ return fun.call(obj, new ns.Event(e)); };
        self.start = function() {
            if (self.node.addEventListener) {
                if (event.indexOf('on') == 0) self.event = event.substr(2);
                self.node.addEventListener(self.event, callback, false);
            } else if (self.node.attachEvent) {
                self.node.attachEvent(self.event, callback);
            }
        };
        self.stop = function() {
            if (self.node.removeEventListener) {
                self.node.removeEventListener(self.event, callback, false);
            } else if (self.node.detachEvent) {
                self.node.detachEvent(self.event, callback);
            }
        }
        self.start();
        return self;
    };
})(GNN.UI);
