var FileBrowser = (function(klass) {
    var $new = GNN.UI.$new;
    var $text = GNN.UI.$text;

    klass.FileViewer = function(d) {
        d = d || document;
        return {
            view: $new('table', { klass: 'file_browser file' }),
            applyStyleFromSource: function(source) {
                source = source.replace(/[\r\n]/g, '');
                var regex = '<style[^>]*>(?:<!--)?(.*?)(?:-->)?</style>';
                if (new RegExp(regex).test(source)) {
                    var rawcss = RegExp.$1;
                    var arr;
                    var re = new RegExp('\\s*([^\{]+?)\\s*{([^\}]*)}','g');
                    var rules = [];
                    while ((arr = re.exec(rawcss)) != null) {
                        if (arr[1].charAt(0) == '.') {
                            rules.push({selector: arr[1], style: arr[2]});
                        }
                    }
                    return this.applyStyle(rules);
                }
            },
            applyStyle: function(rules) {
                if (d.styleSheets[0].addRule) { // IE
                    rules.forEach(function(s) {
                        d.styleSheets[0].addRule(s.selector, s.style);
                    });
                    return true;
                } else {
                    var style = $new('style', { attr: { type: 'text/css' } });
                    style.appendChild($text(rules.map(function(s) {
                        return s.selector+'{'+s.style+'}';
                    }).join("\n")));

                    var head = d.getElementsByTagName('head')[0];
                    if (head) {
                        head.appendChild(style);
                        return true;
                    }
                }
            },
            open: function(content) {
                GNN.UI.removeAllChildren(this.view);
                var row = $new('tr');

                if (content.charAt(content.length-1) != "\n") {
                    content += "\n";
                }

                // line number
                var ln = $new('pre');
                var i = 1, arr;
                var re = new RegExp("\n", 'g');
                while ((arr = re.exec(content)) != null) {
                    ln.appendChild($text(i++ + "\n"));
                }
                row.appendChild($new('td', {
                    klass: 'linenumber',
                    child: ln
                }));

                // content
                var td = $new('td', { klass: 'content', child: pre });
                td.innerHTML = '<pre>'+content+'</pre>';
                row.appendChild(td);

                this.view.appendChild(row);
            }
        };
    };

    return klass;

})(function(args) {
    var $new = GNN.UI.$new;
    var $text = GNN.UI.$text;

    var humanReadableSize = function(size) {
        var prefix = [ '', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' ];
        var i;
        for (i=0; size >= 1024 && i < prefix.length-1; i++) {
            size /= 1024;
        }
        if (i > 0) size = size.toFixed(1);
        return size + prefix[i];
    };

    var handler = args.handler || {};
    handler.dir = handler.dir || function(){};
    handler.file = handler.file || function(){};
    handler.path = handler.path || function(x){ return x; };
    handler.icon = handler.icon || function(){};

    var self = { view: $new('table', { klass: 'file_browser' }) };

    self.move = function(location) {
        if (location.type == 'dir') {
            handler.dir(location, function(entries) {
                GNN.UI.removeAllChildren(self.view);

                self.view.appendChild($new('tr', {
                    child: [
                        [ 'ファイル', 'file' ],
                        [ 'サイズ',   'size' ],
                        [ '更新日時', 'time' ]
                    ].map(function(t) {
                        return $new('th',{ child: t[0], klass: t[1] });
                    })
                }));

                entries.forEach(function(f) {
                    var path = location.path+'/'+f.name;
                    var l = { path: path, name: f.name,
                              type: f.type, time: f.time };
                    var a = $new('a', {
                        attr: { href: handler.path(l) },
                        child: $text(f.name + (f.type=='dir' ? '/' : ''))
                    });
                    if (f.type != 'bin') {
                        new GNN.UI.Observer(a, 'onclick', function(e) {
                            e.stop();
                            self.move(l);
                        });
                    }

                    var label = [ a ];
                    var icon = handler.icon(f);
                    if (icon) label.unshift(icon);
                    var size = humanReadableSize(f.size);
                    self.view.appendChild($new('tr', { child: [
                        $new('td', { child: label, klass: 'file' }),
                        $new('td', { child: $text(size), klass: 'size' }),
                        $new('td', { child: $text(f.time), klass: 'time' })
                    ] }));
                });

                return self.view;
            });
        } else {
            handler.file(location);
        }
    };

    return self;
});
