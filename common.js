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
