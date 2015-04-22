var _ = require('lodash');
var React = require('react');

var trans = function(ex) {
    var option = _.clone(ex[1] || {});
    option.sub = option.sub ? transList(option.sub) : [];
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

var transList = function(exs) { return exs.map(trans); };


// React class for exercise checks

var Label = React.createClass({
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

var Check = React.createClass({
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
                              onChange={this.onChangeChild} />
                       <Label for={id}
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
                           onChange={this.onChange} />
                   <Label for={this.id()}
                          name={p.ex.name}
                          level={p.ex.level}
                          label={p.ex.label}
                          subRequiredNumber={p.ex.required} />
                   {this.subComponents()}
               </li>;
    }
});

var CheckList = React.createClass({
    render: function() {
        var p = this.props;
        var exs = transList(p.exs).map(function(ex) {
            return <Check prefix={p.prefix}
                                  ex={ex}
                                  checkedExs={p.checkedExs}
                                  onChange={p.onChange} />;
        }.bind(this));
        return <ul id={p.nodeId} className='ex'>{exs}</ul>;
    }
});

module.exports = {
    CheckList: CheckList,
    transform: transList
};
