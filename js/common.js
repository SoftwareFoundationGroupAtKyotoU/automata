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
    var none = { uri: 'waiting for request' };
    failed.forEach(function(k){ failedURIs[k]=(jsonp[k]||none).uri; });

    reportFatalErrors([
        { message: 'JSONP request timed out:',
          detail:  failedURIs }
    ]);
};

var loadingIcon = function() {
    return GNN.UI.$new('img', {
        klass: 'loading',
        attr: { src: 'loading.gif' }
    });
};
