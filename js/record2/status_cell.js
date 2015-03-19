var React = require('react');
window.React = React;
var Router = require('react-router');
var Link = Router.Link;
var $ = require('jquery');

module.exports = React.createClass({
    mixins: [Router.Navigation],

    status_map: {
        'none':     '未提出',
        'OK':       '受理',
        'NG':       '要再提出',
        'build':    '確認中',
        'check':    '確認中',
        'build:NG': '要再提出',
        'check:NG': '要再提出',
        'report':   'レポート確認中',
    },

    onEdit: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            editing: 'edit'
        });
    },

    onCancel: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            editing: 'done'
        });
    },

    changeState: function(e) {
        var id = ['report', this.props.report, 'submit'].reduce(function(r, k) {
            if (typeof r[k] === 'undefined') r[k] = {};
            return r[k];
        }, this.props.user);
        var new_status = e.target.value;
        $.post('../api/admin_log.cgi',
               {
                   id: id,
                   user: this.props.user.token,
                   report: this.props.report,
                   status: new_status
               },
               function(result) {
                   this.props.updateStatus(this.props.user.token,
                                           this.props.report,
                                           new_status);
                   this.setState({
                       editing: 'done'
                   });
               }.bind(this));
        this.setState({
            editing: 'exec'
        });
    },

    disable: function(e) {
        e.stopPropagation();
    },

    getDefaultProps: function() {
        return {
            unRead: 0
        };
    },

    getInitialState: function() {
        return {
            editing: 'done',
        };
    },

    render: function() {
        var status = ['report', this.props.report, 'status'].reduce(function(r, k) {
            if (typeof r[k] === 'undefined') r[k] = {};
            return r[k];
        }, this.props.user);
        if (typeof status !== 'string') {
            status = 'none';
        }
        var props = {
            className: 'status ' + status.replace(/:/g, '-')
        };
        if (this.props.isSelected) {
            props.className += ' selected';
        }
        if (this.props.isButton) {
            var transTo = function() {
                this.transitionTo('user', {
                    token: this.props.user.token,
                    report: this.props.report,
                });
            }.bind(this);
            props.className += ' selectable';
            props.onClick = transTo;
        }
        var content;
        if (this.state.editing === 'edit') {
            var opts = Object.keys(this.status_map).map(function(key) {
                var name;
                if (key === 'none') {
                    name = '(' + this.status_map[key] + ')';
                } else {
                    name = key + ' (' + this.status_map[key] + ')';
                }
                return (
                        <option value={key}>{name}</option>
                );
            }.bind(this));
            content = (
                    <select defaultValue={status} onClick={this.disable} onChange={this.changeState}>
                    {opts}
                    </select>
            );
        } else {
            content = (
                    <Link to="user" params={{
                        token: this.props.user.token,
                        report: this.props.report
                    }}>{this.status_map[status]}</Link>
            );
        }
        var edit;
        if (this.props.admin) {
            if (this.state.editing === 'edit') {
                edit = (
                        <a className="edit" href="javascript:void(0)" title="キャンセル" onClick={this.onCancel}>✖</a>
                );
            } else if (this.state.editing === 'exec') {
                edit = (
                        <a className="edit" title="変更中">
                        <img src="../image/loading.gif"/>
                        </a>
                );
            } else {
                edit = (
                        <a className="edit" href="javascript:void(0)" title="変更する" onClick={this.onEdit}>✏</a>
                );
            }
        }
        var unread;
        if (this.props.unRead > 0) {
            unread = (
                    <div className="unread">{this.props.unRead}</div>
            );
        }
        return (
                <td {...props}>
                {unread}{content}{edit}
                </td>
        );
    }
});
