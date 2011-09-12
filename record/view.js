var StatusWindow = function(id, tabs) {
    var make = function(tag, what) {
        return GNN.UI.$new(tag, {
            id: [ id, 'status', what ].join('_'),
            klass: [ 'status', what ].join('_')
        });
    };
    var window = make('div', 'window');
    var header = make('div', 'header');
    var toolbar = make('ul', 'toolbar');
    var tabbar = make('ul', 'tabbar');
    var view = make('div', 'view');
    window.appendChild(header);
    window.appendChild(view);
    header.appendChild(toolbar);
    header.appendChild(tabbar);

    var makeTabId = function(name) {
        return [ id, name, 'tab' ].join('_');
    };
    var lastTab;

    var self = {
        window: window,
        target: null,
        tabs: {},
        add: function(tab) {
            this.tabs[tab.name] = tab;
            var self = this;
            var button = GNN.UI.$new('li', {
                id: [ makeTabId(tab.name), 'button' ].join('_'),
                klass: 'status_tabbar_button'
            });
            button.appendChild(GNN.UI.$text(tab.label));
            tabbar.appendChild(button);
            new GNN.UI.Observer(button, 'click', function() {
                if (self.target) self.show(self.target, tab.name, true);
            });
        },
        show: function(target, tabName, force) {
            this.target = target;
            tabName = (!force && lastTab) || tabName;
            lastTab = tabName;

            for (var t in this.tabs) {
                var tab = this.tabs[t];
                var e = GNN.UI.$([ makeTabId(tab.name), 'button' ].join('_'));
                if (!e) continue;

                if (tab.name == tabName) {
                    GNN.UI.appendClass(e, 'selected');
                    GNN.UI.removeAllChildren(toolbar);
                    GNN.UI.removeAllChildren(view);
                    tab.show(target, toolbar, view);
                } else {
                    GNN.UI.removeClass(e, 'selected');
                }
            }

            window.style.display = 'block';
        },
        hide: function() {
            window.style.display = 'none';
        }
    };

    (tabs||[]).forEach(function(t){ self.add(t) });

    self.hide();

    return self;
};

var LogView = function(id, records) {
    var ppLog = function(k, msg) {
        switch (k) {
        case 'error':
        case 'test case':
        case 'detail': return GNN.UI.$new('pre', { child: GNN.UI.$node(msg) });
        default: return GNN.UI.$node(msg);
        }
    };

    var makeLogMsg = function(record) {
        if (!record.timestamp && !record.log) return null;

        var dl = GNN.UI.$new('dl', { klass: 'log_msg' });
        if (record.timestamp) {
            dl.appendChild(GNN.UI.$new('dt', {
                child: GNN.UI.$node('last update')
            }));
            dl.appendChild(GNN.UI.$new('dd', {
                child: GNN.UI.$node(record.timestamp)
            }));
        }

        if (record.log) {
            if (record.detail) record.log.detail = record.detail;
            var log = record.log;
            for (var k in log) {
                var msg = log[k];
                dl.appendChild(GNN.UI.$new('dt', { child: GNN.UI.$node(k) }));
                dl.appendChild(GNN.UI.$new('dd', { child: ppLog(k, msg) }));
            }
        }

        return dl;
    };

    var self = {
        name: 'log',
        label: 'ログ',
        show: function(target, toolbar, view) {
            var student = records.reduce(function(r, u) {
                return target == u.token ? u : r;
            }, { report: {} });
            var record = student.report[id]||{};
            var msg = makeLogMsg(record);
            if (msg) view.appendChild(msg);
        }
    };

    return self;
};

var FileBrowserView = function(id) {
    var $new = GNN.UI.$new;
    var $text = GNN.UI.$text;

    var Breadcrum = function(browser, parent) {
        var descend = function(path) {
            return path.split('/').reduce(function(r, p) {
                r[1].push(p);
                r[0].push({ name: p, path: r[1].join('/') });
                return r;
            }, [ [], [] ])[0];
        };
        return {
            set: function(location) {
                GNN.UI.removeAllChildren(parent);

                parent.appendChild($new('li', { child: '場所:' }));

                var list = descend(location.path).map(function(p) {
                    p.type = 'dir';
                    return p;
                });
                list[list.length-1].type = location.type;

                list.forEach(function(loc) {
                    if (loc.name == '.') loc.name = id;

                    var a = $new('a', {
                        child: loc.name,
                        attr: { href: browser.rawURI(loc.path) }
                    });
                    new GNN.UI.Observer(a, 'click', function(e) {
                        e.stop();
                        browser.move(loc);
                    });

                    parent.appendChild($new('li', {
                        child: a, klass: 'breadcrum'
                    }));
                });
            }
        };
    };

    var Browser = function(target, location) {
        var table = $new('table', {
            klass: 'file_browser'
        });

        var humanReadableSize = function(size) {
            var prefix = [ '', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' ];
            var i;
            for (i=0; size >= 1024 && i < prefix.length-1; i++) {
                size /= 1024;
            }
            if (i > 0) size = size.toFixed(1);
            return size + prefix[i];
        };

        var self = {
            view: table,
            location: location || { path: '.', type: 'dir' },
            rawURI: function(path) {
                return browse(target, id, path);
            },
            show: function(toolbar, view) {
                this.breadcrum = new Breadcrum(this, toolbar);
                view.appendChild(this.view);
                this.move(this.location);
            }
        };

        var replaceView = function(node) {
            var parent = self.view.parentNode;
            GNN.UI.removeAllChildren(parent);
            parent.appendChild(node);
            self.view = node;
        };

        self.move = function(location) {
            replaceView(loadingIcon());
            this.location = location;
            this.breadcrum.set(location);

            if (location.type == 'dir') {
                GNN.JSONP.retrieve({
                    entries: api('browse', {
                        user: target,
                        report: id,
                        path: location.path
                    })
                }, function(json) {
                    GNN.UI.removeAllChildren(table);
                    table.appendChild($new('tr', {
                        child: [
                            [ 'ファイル', 'file' ],
                            [ 'サイズ', 'size' ],
                            [ '更新日時', 'time' ]
                        ].map(function(t) {
                            return $new('th',{ child: t[0], klass: t[1] });
                        })
                    }));

                    json.entries.forEach(function(f) {
                        var path = location.path+'/'+f.name;
                        var a = $new('a', {
                            attr: { href: self.rawURI(path) },
                            child: $text(f.name + (f.type=='dir' ? '/' : ''))
                        });
                        if (f.type != 'bin') {
                            new GNN.UI.Observer(a, 'click', function(e) {
                                e.stop();
                                self.move({ path: path, type: f.type });
                            });
                        }

                        var size = humanReadableSize(f.size);
                        table.appendChild($new('tr', {
                            child: [
                                $new('td', { child: a,
                                             klass: 'file' }),
                                $new('td', { child: $text(size),
                                             klass: 'size' }),
                                $new('td', { child: $text(f.time),
                                             klass: 'time' })
                            ]
                        }));
                    });

                    replaceView(table);
                }, function() {
                    replaceView($text('読み込み失敗'));
                });
            } else  {
                // TODO
            }
        };

        return self;
    };
    var browsers = {};

    return {
        name: 'file',
        label: 'ファイル一覧',
        show: function(target, toolbar, view) {
            if (!browsers[target]) browsers[target] = new Browser(target);
            browsers[target].show(toolbar, view);
        }
    };
};
