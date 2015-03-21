var _ = require('lodash');
var $ = require('jquery');
var React = require('react');

var api = function(name) {
    var pathname = location.pathname.split('/');
    pathname.pop(); pathname.pop();
    return location.protocol + '//' + location.host +
        pathname.join('/')+'/api/'+name+'.cgi';
};

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
            attr('href', encodeURIComponent(l.uri));
        footer.prepend(a);
    });
};

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

var jsonpFailure = function(reason, jsonp, failed) {
    var failedURIs = {};
    var none = { uri: 'preparing for request' };
    failed.forEach(function(k){ failedURIs[k]=(jsonp[k]||none).uri; });

    reportFatalErrors([
        { message: 'JSONP request failed:',
          reason: reason,
          detail:  failedURIs }
    ]);
};

var apiCall = function() {
    var params = _.toArray(arguments);
    var d = $.Deferred();

    $.when.apply($, params.map(function(p) { return $.ajax({
        method: p.method,
        url:    api(p.api),
        data:   p.data,
        error:  jsonpFailure
    }); })).then(function() {
        d.resolve.apply(d, _.toArray(arguments).map(function (r) {
            if (r.length === 3) {
                r[0].__original_response = r;
                r = r[0];
            }
            return r;
        }));
    });

    return d;
};

var apiGet = function() {
    var params = _.toArray(arguments);
    params.forEach(function (p) { p.method = 'GET'; });
    return apiCall.apply(this, params);
};

var apiPost = function() {
    var params = _.toArray(arguments);
    params.forEach(function (p) { p.method = 'Post'; });
    return apiCall.apply(this, params);
};

var transEx = function(ex) {
    var option = _.clone(ex[1] || {});
    option.sub = option.sub ? transExList(option.sub) : [];
    var hasSubs = option.sub.length > 0;
    var label =
        (hasSubs && option.sub.every(function(sub) {
            return sub.required;
        })) ? 'all' :
        (!hasSubs && option.required === 1) ? 'all' :
        (hasSubs  && option.required) ? 'some' :
        '';
    return _.merge({ name: ex[0], label: label }, option);
};

var transExList = function(exs) { return exs.map(transEx); };


// React class for exercise checks

var ExerciseLabel = React.createClass({
    render: function() {
        var p = this.props;
        var name = p.name;

        if (p.level) {
            name += '[' + new Array(p.level+1).join('★') + ']';
        }

        if (p.label === 'all') {
            name += ' [必修]';
        } else if (p.label === 'some') {
            name += ' [必修(' + p.subRequiredNumber + '問選択)]';
        }

        return <label htmlFor={p.for}>{name}</label>;
    }
});

var ExerciseCheck = React.createClass({
    onChange: function(e) {
        var name = e.target.value;
        var checked = e.target.checked;
        var exs =
            this.subs().map(function(s) { return s.name; }).concat([name]);

        this.props.onChange(exs, checked);
    },

    onChangeChild: function(e) {
        var name = e.target.value;
        var checked = e.target.checked;
        var p = this.props;

        if (checked && this.subs().every(function(sub) {
            return sub.name === name || this.checked(sub.name);
        }.bind(this))) {
            p.onChange([p.ex.name, name], true);
        } else {
            p.onChange([name], checked);
            !checked && p.onChange([p.ex.name], false);
        }
    },

    subs: function() { return this.props.ex.sub; },
    checked: function(name) { return this.props.checkedExs[name]; },
    id: function() { return this.props.prefix+this.props.ex.name; },

    subComponents: function() {
        var subs = this.subs();
        if (subs.length === 0) return;

        var p = this.props;
        var subComponents = subs.map(function(sub) {
            var id = p.prefix+sub.name;
            var label = sub.required && p.ex.label !== 'all' ? 'all' : '';
                
            return <li>
                       <input id={id} type='checkbox'
                              name='ex[]' value={sub.name}
                              checked={this.checked(sub.name)}
                              required={sub.required}
                              onChange={this.onChangeChild} />
                       <ExerciseLabel for={id}
                                      name={sub.name}
                                      level={sub.level}
                                      label={label} />
                   </li>;
        }.bind(this));

        return <ul>{subComponents}</ul>;
    },

    render: function() {
        var p = this.props;

        return <li>
                   <input id={this.id()} type='checkbox' name='ex[]'
                           value={p.ex.name} checked={this.checked(p.ex.name)}
                           required={p.ex.label === 'all'}
                           onChange={this.onChange} />
                   <ExerciseLabel for={this.id()}
                                  name={p.ex.name}
                                  level={p.ex.level}
                                  label={p.ex.label}
                                  subRequiredNumber={p.ex.required} />
                   {this.subComponents()}
               </li>;
    }
});

var ExerciseCheckList = React.createClass({
    render: function() {
        var p = this.props;
        var exs = transExList(p.exs).map(function(ex) {
            return <ExerciseCheck prefix={p.prefix}
                                  ex={ex}
                                  checkedExs={p.checkedExs}
                                  onChange={p.onChange} />;
        }.bind(this));
        return <ul id={p.nodeId} className='ex'>{exs}</ul>;
    }
});

module.exports = {
    setTitle: setTitle,
    addLinks: addLinks,
    apiGet: apiGet,
    apiPost: apiPost,
    ExerciseCheckList: ExerciseCheckList,
    transformExercises: transExList
};
