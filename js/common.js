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
