var init = function() {
    var base = function() {
        var uri = GNN.URI.location();
        uri.local.pop();
        return uri;
    };
    var api = function(name, args) {
        var uri = base();
        uri.local.push('api');
        uri.local.push(name+'.cgi');
        uri.params = args || {};
        return uri;
    };

    with (GNN.UI) {
        var Uploader = function(scheme, solved) {
            var self = {};

            var form = $('form');
            new Observer(form, 'onsubmit', function(e) {
                if ($('file').value == '') {
                    e.stop();
                    alert('ファイルを選択して下さい');
                }
            });

            scheme.forEach(function(report) {
                var selector = $('selector');
                var li = $new('li', { id: 'button_'+report.id });
                selector.appendChild(li);

                var button = $new('a', {
                    attr: { href: '.' },
                    child: $text(report.name)
                });
                new Observer(button, 'click', function(e) {
                    e.stop();
                    self.unselectAll();
                    self.select(report);
                });
                li.appendChild(button);
            });

            self.unselect = function(id) {
                var button = $('button_'+id);
                button.className = '';
            };

            self.unselectAll = function() {
                scheme.forEach(function(report){ self.unselect(report.id); });
            };

            self.select = function(report) {
                $('report_id').value = report.id;

                // report selector
                var button = $('button_'+report.id);
                button.className = 'selected';

                // show selected report
                var selected = $('selected_report');
                removeAllChildren(selected);
                selected.appendChild($node(report.name));

                // requirements depending on selected exercises
                var nodeOfReq = function(r) {
                    var li = $new('li');
                    switch (r.type) {
                    case 'code':
                        li.appendChild($new('code', {
                            child: $node(r.value)
                        }));
                        break;
                    case 'html':
                        li.innerHTML = r.value;
                        break;
                    case 'text':
                        li.appendChild($node(r.value));
                        break;
                    default:
                        return;
                    }
                    return li;
                };
                var updateReqs = function() {
                    var reqs = report.requirements;
                    if (reqs && reqs.dynamic) {
                        reqs.dynamic.forEach(function(d) {
                            var target = $(d.target);
                            if (!target) return;
                            removeAllChildren(target);

                            var list = d['default'];
                            for (var x in d) {
                                var node = $(x);
                                if (node && node.checked) {
                                    d[x].forEach(function(r) {
                                        list = list.map(function(s) {
                                            return s.name == r.name ? r : s;
                                        });
                                    });
                                    var rest = d[x].filter(function(r) {
                                        return !list.some(function(s) {
                                            return s.name == r.name;
                                        });
                                    });
                                    list = list.concat(rest);
                                }
                            }

                            list.forEach(function(r) {
                                var node = nodeOfReq(r);
                                if (node) target.appendChild(node);
                            });
                        });
                    }
                };

                // exercise selector
                var ul = $('ex');
                removeAllChildren(ul);

                var lastSolved = (solved[report.id]||{}).solved;
                report.exercise.forEach(function(ex) {
                    var name = ex[0];
                    var option = ex[1];
                    var li = $new('li');
                    var check = $new('input', {
                        id: name,
                        attr: {
                            type: 'checkbox',
                            name: name,
                            value: 'yes'
                        }
                    });
                    new Observer(check, 'onchange', updateReqs);
                    new Observer(check, 'onclick', updateReqs);  // for IE
                    if (lastSolved && lastSolved.indexOf(name) >= 0) {
                        check.checked = true;
                    }
                    if (option.level) {
                        var stars = '';
                        var level = parseInt(option.level);
                        for (var i=0; i < level; i++) stars += '★';
                        name += '['+stars+']';
                    }
                    if (option.required) {
                        name += ' [必修課題]';
                        if ((lastSolved||[]).length <= 0) check.checked = true;
                    }
                    var label = $new('label', {
                        child: $node(name),
                        attr: { 'for': name }
                    });
                    li.appendChild(check);
                    li.appendChild(label);
                    ul.appendChild(li);
                });

                // requirements
                reqs = $('requirements')
                removeAllChildren(reqs);
                if (report.requirements) {
                    sttc = report.requirements['static'];
                    if (sttc) {
                        sttc.forEach(function(r) {
                            node = nodeOfReq(r);
                            if (node) reqs.appendChild(node);
                        });
                    }
                }
                updateReqs();
            };

            self.unselectAll();
            self.select(scheme[0]);

            return self;
        };

        GNN.JSONP.retrieve({
            master: api('master', { year: true, user: true, token: true }),
            scheme: api('scheme', { type: 'post', exercise: true,
                                    requirements: true })
        }, function(json) {
            setYear(json.master.year);

            // set login name
            var login = $('login');
            login.appendChild($node(json.master.user));

            new GNN.JSONP(api('user', {
                user: json.master.user,
                type: 'status',
                status: 'solved'
            }), function(user) {
                // setup uploader
                user = user[0]||{};
                var report = user.token==json.master.token ? user.report:null;
                new Uploader(json.scheme, report||{});
            });
        });
    }
};
