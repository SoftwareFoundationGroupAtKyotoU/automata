var base = function() {
    var uri = GNN.URI.location();
    uri.local.pop(); uri.local.pop();
    return uri;
};
var api = function(name, args) {
    var uri = base();
    uri.local.push('api');
    uri.local.push(name+'.cgi');
    uri.params = args || {};
    uri.refresh = function() {
        delete uri.params.timestamp;
        return uri;
    };
    return uri;
};

var setTitle = function(template) {
    with (GNN.UI) {
        [ 'title', 'subtitle', 'institute' ].forEach(function(x) {
            var node = $(x);
            if (node) {
                removeAllChildren(node);
                node.appendChild($text(template[x]));
            }
        });

        document.title = [
            template.subtitle,
            template.title
        ].join(' - ');
    }
};

var addLinks = function(links) {
    with (GNN.UI) {
        links = links || [];

        var footer = $('footer');
        if (!footer) return;

        links.reverse().forEach(function(l) {
            var node = $new('a', {
                attr: { href: l.uri },
                child: l.label
            });
            if (footer.firstChild) {
                footer.insertBefore(node, footer.firstChild);
            } else {
                footer.appendChild(node);
            }
        });
    }
};

var reportFatalErrors = function(errors) {
    with (GNN.UI) {
        var toNode = function(v) {
            if (v instanceof Array) {
                var ul = $new('ul');
                v.forEach(function(x) {
                    ul.appendChild($new('li', { child: toNode(x) }));
                });
                return ul;
            } else if (typeof v == 'object') {
                var dl = $new('dl');
                for (var k in v) {
                    dl.appendChild($new('dt', { child: k }));
                    dl.appendChild($new('dd', { child: toNode(v[k]) }));
                }
                return dl;
            } else {
                return $text(v+'');
            }
        };

        div = $('fatalerror');
        div.appendChild($new('h3', { child: 'Error' }));

        var ul = $new('ul');
        errors.forEach(function(e) {
            var li = $new('li', { child: e.message });
            if (e.detail) li.appendChild(toNode(e.detail));
            ul.appendChild(li);
        });
        div.appendChild(ul);
    }
};

var jsonpFailure = function(jsonp, failed) {
    failedURIs = {};
    var none = { uri: 'preparing for request' };
    failed.forEach(function(k){ failedURIs[k]=(jsonp[k]||none).uri; });

    reportFatalErrors([
        { message: 'JSONP request timed out:',
          detail:  failedURIs }
    ]);
};

var apiPost = function(cgi, args, callback, error) {
    var toFormData = function(hash) {
        var list = [];
        for (var k in hash) {
            list.push([k, hash[k]].map(encodeURIComponent).join('='));
        }
        return list.join(';');
    };
    callback = callback || function(){};
    error = error || function(){};

    var req = new XMLHttpRequest();
    var uri = api(cgi, {});
    var mime = 'application/x-www-form-urlencoded';
    req.open('POST', uri+'');
    req.setRequestHeader('Content-Type', mime);

    req.onreadystatechange = function(e) {
        if (req.readyState == 4) {
            if (200 <= req.status && req.status < 300) {
                callback(req);
            } else {
                error(req);
            }
        }
    }

    req.send(toFormData(args));
};

var loadingIcon = function() {
    return GNN.UI.$new('img', {
        klass: 'loading',
        attr: { src: 'loading.gif' }
    });
};

var makeExerciseSelector = function(parent, exs, solved, prefix, updateReqs) {
    var $new = GNN.UI.$new;
    var Observer = GNN.UI.Observer;
    prefix = prefix || 'ex';

    var makeCheck = function(name, option) {
        var id = prefix + name;

        var check = $new('input', {
            id: id, attr: { type: 'checkbox', name: 'ex', value: name }
        });

        if (updateReqs) {
            new Observer(check, 'onchange', updateReqs);
            new Observer(check, 'onclick', updateReqs); // IE
        }

        if ((solved||[]).indexOf(name) >= 0) check.checked = true;
        if (option.level) {
            var stars = '';
            var level = option.level;
            for (var i=0; i < level; i++) stars += '★';
            name += '['+stars+']';
        }
        if (option.required) {
            if (Math.abs(option.required) == (option.number||1)) {
                if (option.required > 0) name += ' [必修]';
                if (!solved) check.checked = true;
            } else if (!(option.required instanceof Array)) {
                name += ' [必修('+option.required+'問選択)]';
            }
        }
        var label = $new('label', {
            child: name,
            attr: { 'for': id }
        });

        return { check: check, label: label };
    };

    exs.forEach(function(ex) {
        var name = ex[0];
        var option = ex[1] || {};
        var li = $new('li');
        if (option.sub && option.sub.every(function(sub) {
            return (sub[1]||{}).required;
        })) {
            option.required = option.sub.length;
            option.number = option.sub.length;
        }
        var r = makeCheck(name+'', option);

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
                var sr = makeCheck(sname, sopt, solved);

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

        parent.appendChild(li);
    });
};

