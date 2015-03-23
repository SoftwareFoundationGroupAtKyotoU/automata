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

var api = function(name, params) {
    var pathname = location.pathname.split('/');
    pathname.pop(); pathname.pop();
    return location.protocol + '//' + location.host +
        pathname.join('/')+'/api/'+name+'.cgi';
};

var call = function() {
    var params = _.toArray(arguments);
    var d = $.Deferred();

    $.when.apply($, params.map(function(p) { return $.ajax({
        method: p.method,
        url:    api(p.api),
        data:   p.data,
        error:  function(jqXHR, status) {
            jsonpFailure(status || 'request',
                         api(p.api)+(p.data ? '?'+$.param(p.data) : ''));
        }
    }); })).done(function() {
        var responses = _.toArray(arguments);
        responses = params.length === 1 ? [responses] : responses;
        d.resolve.apply(d, responses.map(function (r) { return r[0]; }));
    });

    return d;
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
    get: get,
    post: post
};
