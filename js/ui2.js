var $ = require('jquery');

var setTitle = function(template) {
    [ 'title', 'subtitle', 'institute' ].forEach(function(x) {
        $('#'+x).empty().text(template[x]);
    });

    document.title = [
        template.subtitle,
        template.title
    ].join(' - ');
};

var addLinks = function(links) {
    links = links || [];

    var footer = $('#footer');

    links.reverse().forEach(function(l) {
        var a = $('<a />').
            text(l.label).
            attr('href', l.uri);
        footer.prepend(a);
    });
};

module.exports = {
    setTitle: setTitle,
    addLinks: addLinks
}
