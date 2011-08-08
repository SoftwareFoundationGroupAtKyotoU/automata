var init = function() {
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

                var makeCheck = function(name, option, solved) {
                    var check = $new('input', {
                        id: name,
                        attr: {
                            type: 'checkbox',
                            name: name,
                            value: 'yes'
                        }
                    });

                    new Observer(check, 'onchange', updateReqs);
                    new Observer(check, 'onclick', updateReqs); // IE

                    if (solved.indexOf(name) >= 0) check.checked = true;
                    if (option.level) {
                        var stars = '';
                        var level = option.level;
                        for (var i=0; i < level; i++) stars += '★';
                        name += '['+stars+']';
                    }
                    if (option.required) {
                        if (Math.abs(option.required) == (option.number||1)) {
                            if (option.required > 0) name += ' [必修]';
                            if (solved.length <= 0) check.checked = true;
                        } else if (!(option.required instanceof Array)) {
                            name += ' [必修('+option.required+'問選択)]';
                        }
                    }
                    var label = $new('label', {
                        child: $node(name),
                        attr: { 'for': name }
                    });

                    return { check: check, label: label };
                };

                // exercise selector
                var ul = $('ex');
                removeAllChildren(ul);

                var lastSolved = (solved[report.id]||{}).solved || [];
                report.exercise.forEach(function(ex) {
                    var name = ex[0];
                    var option = ex[1] || {};
                    var li = $new('li');
                    if (option.sub && option.sub.every(function(sub) {
                        return (sub[1]||{}).required;
                    })) {
                        option.required = option.sub.length;
                        option.number = option.sub.length;
                    }
                    var r = makeCheck(name+'', option, lastSolved);

                    li.appendChild(r.check);
                    li.appendChild(r.label);

                    var subs = [];

                    // Ex.X.XX(i)
                    if (option.sub) {
                        var sul = $new('ul');
                        option.sub.forEach(function(sub) {
                            var sname = sub[0];
                            var sopt = sub[1] || {};
                            if (option.required == option.sub.length) {
                                sopt.required = -1;
                            }

                            var sli = $new('li');
                            var sr = makeCheck(sname, sopt, lastSolved);

                            sli.appendChild(sr.check);
                            sli.appendChild(sr.label);
                            sul.appendChild(sli);
                            subs.push(sr.check);
                        });
                        li.appendChild(sul);

                        // synchronize parent and child check boxes
                        var onChild = function() {
                            r.check.checked = subs.every(function(child) {
                                return child.checked;
                            });
                        };
                        var onParent = function(e) {
                            var c = e.target().checked;
                            subs.forEach(function(child){ child.checked=c; });
                        };
                        subs.forEach(function(child){
                            new Observer(child, 'onchange', onChild);
                            new Observer(child, 'onclick', onChild); // IE
                        });
                        new Observer(r.check, 'onchange', onParent);
                        new Observer(r.check, 'onclick', onParent); // IE
                        onChild();
                    }

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
            scheme: api('scheme', { type: 'post', exercise: true }),
            template: api('template', { type: 'post', links: true,
                                        requirements: true })
        }, function(json) {
            // fill page template
            setTitle(json.template);
            addLinks(json.template.links);

            // set login name
            var login = $('login');
            login.appendChild($node(json.master.user));

            new GNN.JSONP(api('user', {
                user: json.master.user,
                type: 'status',
                status: 'solved'
            }), function(user) {
                // setup uploader
                json.scheme.forEach(function(rep) {
                    var req = json.template.requirements[rep.id];
                    if (req) rep.requirements = req;
                });
                user = user[0]||{};
                var report = user.token==json.master.token ? user.report:null;
                new Uploader(json.scheme, report||{});
            });
        }, jsonpFailure);
    }
};
