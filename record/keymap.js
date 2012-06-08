if (typeof KeyEvent == 'undefined') {
    var KeyEvent = {
        DOM_VK_CANCEL: 3,
        DOM_VK_HELP: 6,
        DOM_VK_BACK_SPACE: 8,
        DOM_VK_TAB: 9,
        DOM_VK_CLEAR: 12,
        DOM_VK_RETURN: 13,
        DOM_VK_ENTER: 14,
        DOM_VK_SHIFT: 16,
        DOM_VK_CONTROL: 17,
        DOM_VK_ALT: 18,
        DOM_VK_PAUSE: 19,
        DOM_VK_CAPS_LOCK: 20,
        DOM_VK_ESCAPE: 27,
        DOM_VK_SPACE: 32,
        DOM_VK_PAGE_UP: 33,
        DOM_VK_PAGE_DOWN: 34,
        DOM_VK_END: 35,
        DOM_VK_HOME: 36,
        DOM_VK_LEFT: 37,
        DOM_VK_UP: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_DOWN: 40,
        DOM_VK_PRINTSCREEN: 44,
        DOM_VK_INSERT: 45,
        DOM_VK_DELETE: 46,
        DOM_VK_0: 48,
        DOM_VK_1: 49,
        DOM_VK_2: 50,
        DOM_VK_3: 51,
        DOM_VK_4: 52,
        DOM_VK_5: 53,
        DOM_VK_6: 54,
        DOM_VK_7: 55,
        DOM_VK_8: 56,
        DOM_VK_9: 57,
        DOM_VK_SEMICOLON: 59,
        DOM_VK_LEFT_SHIFT: 60,
        DOM_VK_EQUALS: 61,
        DOM_VK_RIGHT_SHIFT: 62,
        DOM_VK_A: 65,
        DOM_VK_B: 66,
        DOM_VK_C: 67,
        DOM_VK_D: 68,
        DOM_VK_E: 69,
        DOM_VK_F: 70,
        DOM_VK_G: 71,
        DOM_VK_H: 72,
        DOM_VK_I: 73,
        DOM_VK_J: 74,
        DOM_VK_K: 75,
        DOM_VK_L: 76,
        DOM_VK_M: 77,
        DOM_VK_N: 78,
        DOM_VK_O: 79,
        DOM_VK_P: 80,
        DOM_VK_Q: 81,
        DOM_VK_R: 82,
        DOM_VK_S: 83,
        DOM_VK_T: 84,
        DOM_VK_U: 85,
        DOM_VK_V: 86,
        DOM_VK_W: 87,
        DOM_VK_X: 88,
        DOM_VK_Y: 89,
        DOM_VK_Z: 90,
        DOM_VK_CONTEXT_MENU: 93,
        DOM_VK_NUMPAD0: 96,
        DOM_VK_NUMPAD1: 97,
        DOM_VK_NUMPAD2: 98,
        DOM_VK_NUMPAD3: 99,
        DOM_VK_NUMPAD4: 100,
        DOM_VK_NUMPAD5: 101,
        DOM_VK_NUMPAD6: 102,
        DOM_VK_NUMPAD7: 103,
        DOM_VK_NUMPAD8: 104,
        DOM_VK_NUMPAD9: 105,
        DOM_VK_MULTIPLY: 106,
        DOM_VK_ADD: 107,
        DOM_VK_SEPARATOR: 108,
        DOM_VK_SUBTRACT: 109,
        DOM_VK_DECIMAL: 110,
        DOM_VK_DIVIDE: 111,
        DOM_VK_F1: 112,
        DOM_VK_F2: 113,
        DOM_VK_F3: 114,
        DOM_VK_F4: 115,
        DOM_VK_F5: 116,
        DOM_VK_F6: 117,
        DOM_VK_F7: 118,
        DOM_VK_F8: 119,
        DOM_VK_F9: 120,
        DOM_VK_F10: 121,
        DOM_VK_F11: 122,
        DOM_VK_F12: 123,
        DOM_VK_F13: 124,
        DOM_VK_F14: 125,
        DOM_VK_F15: 126,
        DOM_VK_F16: 127,
        DOM_VK_F17: 128,
        DOM_VK_F18: 129,
        DOM_VK_F19: 130,
        DOM_VK_F20: 131,
        DOM_VK_F21: 132,
        DOM_VK_F22: 133,
        DOM_VK_F23: 134,
        DOM_VK_F24: 135,
        DOM_VK_NUM_LOCK: 144,
        DOM_VK_SCROLL_LOCK: 145,
        DOM_VK_COMMA: 188,
        DOM_VK_PERIOD: 190,
        DOM_VK_SLASH: 191,
        DOM_VK_BACK_QUOTE: 192,
        DOM_VK_OPEN_BRACKET: 219,
        DOM_VK_BACK_SLASH: 220,
        DOM_VK_CLOSE_BRACKET: 221,
        DOM_VK_QUOTE: 222,
        DOM_VK_META: 224
    };
}

var KeyMap = (function() {
    var toA = function(a, s, e){ return Array.prototype.slice.call(a,s,e); };
    var toCamelCase = function(str) {
        var f = function(m, n1, n2){ return n2.toUpperCase(); };
        return str.replace(/(^|_)(.)/g, f);
    };

    var specialNames = {
        back_space: 'BS',
        escape: 'Esc',
        space: 'Space',
        insert: 'Ins',
        delete: 'Del',
        semicolon: ';',
        left_shift: '<',
        equals: '=',
        right_shift: '>',
        subtract: '-',
        comma: ',',
        period: '.',
        slash: '/',
        back_quote: '`',
        open_bracket: '[',
        back_slash: '\\',
        close_bracket: ']',
        quote: "'"
    };
    var code2key = {};
    var key2code = { ' ': 32, '<': 60 };
    for (var k in KeyEvent) { if (/^DOM_VK_(?![A-Z0-9]$)/.test(k)) {
        var v = KeyEvent[k];
        k = k.substr('DOM_VK_'.length).toLowerCase();
        var names = toCamelCase(k.replace(/^numpad/, 'num'));
        if (k in specialNames) names = specialNames[k];
        code2key[v] = names;
    } }
    code2key[60] = '<';

    var split = function(keyseq) {
        var list = keyseq.split(/ +/);
        return list.reduce(function(r, x) {
            if (r.escape) {
                r.l[r.l.length-1] += ' ' + x;
            } else {
                r.l.push(x);
            }
            r.escape = /\\$/.test(x);
            return r;
        }, { l: [], escape: false }).l;
    };
    var description = function(event) {
        var key;
        var mod = '';
        var shift;
        var charCode = (event.type == 'keyup' ? 0 : event.charCode);

        if (charCode == 0) {
            if (event.keyCode in code2key) {
                if (event.shiftKey) shift = true;
                key = code2key[event.keyCode];
            } else {
                charCode = event.keyCode;
            }
        } else if (event.ctrlKey && 27 <= charCode && charCode < 31) {
            if (charCode == 27) {
                key = code2key[charCode];
            } else {
                key = String.fromCharCode(charCode + 64);
            }
        }
        if (charCode > 0 && !key) {
            key = String.fromCharCode(charCode);
            if (key in key2code) {
                if (/^\s$/.test(key) && event.shiftKey) shift = true;
                key = code2key[key2code[key]];
            } else if (event.charCode == 0) {
                key = key.toLowerCase();
                if (key != key.toUpperCase()) {
                    if (event.shiftKey) key = key.toUpperCase();
                } else if (event.shiftKey) {
                    shift = true;
                }
            }
        }

        if (event.ctrlKey && key != 'Control') mod += 'C-';
        if (event.altKey && key != 'Alt') mod += 'A-';
        if (event.metaKey && key != 'Meta') mod += 'M-';
        if (shift && key != 'Shift') mod += 'S-';

        if (key) return mod + key;
    };

    var tag = {};

    var initialize = function(recv) {
        var map = {};
        var self = this;

        var define = function(keyseq, def) {
            var list = split(keyseq);
            if (list.length < 1) {
                throw new TypeError('Empty key sequence');
            } else if (list.length == 1) {
                map[list[0]] = def;
            } else {
                var key = list.shift();
                var m = map[key];
                if (!(m instanceof KeyMap)) {
                    m = map[key] = new KeyMap(recv);
                }
                m.define(list.join(' '), def);
            }
        };

        self.define = function(keyseq, def, rest) {
            var args = toA(arguments);
            while (args.length > 0) {
                keyseq = args.shift();
                def = args.shift();
                define(keyseq, def);
            }
        };
        self.lookup = function(keyOrEvent) {
            var keyseq = keyOrEvent;
            if (keyOrEvent instanceof Event) keyseq = description(keyOrEvent);
            var list = (keyseq instanceof Array) ? keyseq : split(keyseq);
            var def = map[list.shift()];
            if (list.length == 0) {
                return def;
            } else if (def instanceof KeyMap) {
                return def.lookup(list);
            } else if (typeof def == 'function') {
                /* reserved for future use */
            }
        };
        self.exec = function(keyOrEvent) {
            var cmd = this.lookup(keyOrEvent);
            if (typeof cmd == 'string') cmd = recv[cmd];
            if (typeof cmd == 'function') {
                return cmd.call(recv);
            }
            return cmd;
        };
    };

    var ctor = function(arg) {
        if (arg !== tag) {
            var self = new ctor(tag);
            initialize.apply(self, arguments);
            return self;
        }
    };

    ctor.Proxy = function(recv, parent) {
        var self = new KeyMap(recv);
        self.parent = parent || { lookup: function(){}, exec: function(){} };
        self.lookup_ = self.lookup;
        self.exec_ = self.exec;
        self.lookup = function(keyOrEvent) {
            var cmd = self.lookup_(keyOrEvent);
            if (cmd) return cmd;
            return self.parent.lookup(keyOrEvent);
        };
        self.exec = function(keyOrEvent) {
            var cmd = self.lookup_(keyOrEvent);
            if (cmd) return self.exec_(keyOrEvent);
            return self.parent.exec(keyOrEvent);
        };
        return self;
    };

    ctor.split = split;
    ctor.description = description;

    return ctor;
})();
