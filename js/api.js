var _ = require('lodash');
var $ = require('jquery');

var reportFatalErrors = function(errors) {
    var toNode = function(v) {
        if (v instanceof Array) {
            var ul = $('<ul />');
            v.forEach(function(x) {
                ul.append($('<li />').append(toNode(x)));
            });
            return ul;
        } else if (typeof v == 'object') {
            var dl = $('<dl />');
            for (var k in v) {
                dl.append(
                    $('<dt />').append(k),
                    $('<dd />').append(toNode(v[k]))
                );
            }
            return dl;
        } else {
            return document.createTextNode(v+'');
        }
    };

    var div = $('#fatalerror').append($('<h3 />').text('Error'));

    var ul = $('<ul />');
    errors.forEach(function(e) {
        var li = $('<li />').text(e.message + ' (' + e.reason + ')');
        if (e.detail) li.append(toNode(e.detail));
        ul.append(li);
    });
    div.append(ul);
};

var jsonpFailure = function(reason, uri) {
    reportFatalErrors([
        { message: 'JSONP request failed:',
          reason: reason,
          detail:  [uri] }
    ]);
};

var root = (function() {
    var pathname = location.pathname.split('/');
    pathname.pop(); pathname.pop();
    return location.protocol + '//' + location.host + pathname.join('/');
})();

var api = function(name) {
    return root + '/api/' + name + '.cgi';
};

var call = function() {
    var params = _.toArray(arguments);
    var d = $.Deferred();

    $.when.apply($, params.map(function(p) { return $.ajax({
        method: p.method,
        url:    api(p.api),
        data:   p.data,
        cache:  false,
        error:  function(jqXHR, status) {
            jsonpFailure(status || 'request',
                         api(p.api)+(p.data ? '?'+$.param(p.data) : ''));
        }
    }); })).done(function() {
        var responses = _.toArray(arguments);
        responses = params.length === 1 ? [responses] : responses;
        d.resolve.apply(d, responses.map(function (r) { return r[0]; }));
    }).fail(function() {
        d.reject.apply(d, arguments);
    });

    return d.promise();
};

var get = function() {
    var params = _.toArray(arguments);
    params.forEach(function (p) { p.method = 'GET'; });
    return call.apply(this, params);
};

var post = function() {
    var params = _.toArray(arguments);
    params.forEach(function (p) { p.method = 'Post'; });
    return call.apply(this, params);
};

module.exports = {
    root: root,
    get: get,
    post: post
};
