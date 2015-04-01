var React = require('react');
var Router = require('react-router');
var Link = Router.Link;
var api = require('../api');

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
        api.post({
            api: 'admin_log',
            data: {
                id: id,
                user: this.props.user.token,
                report: this.props.report,
                status: new_status
            }
        }).done(function() {
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
        if (!this.props.isSelected && this.props.isButton) {
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
        } else if (this.props.isSelected) {
            content = this.status_map[status];
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
                    <a className="edit" href="javascript:void(0)" title="キャンセル" onClick={this.onCancel}>
                        <i className="fa fa-times edit"/>
                    </a>
                );
            } else if (this.state.editing === 'exec') {
                edit = (
                        <a className="edit" title="変更中">
                        <i className="fa fa-spinner fa-pulse"/>
                        </a>
                );
            } else {
                edit = (
                    <a className="edit" href="javascript:void(0)" title="変更する" onClick={this.onEdit}>
                        <i className="fa fa-pencil-square-o edit"/>
                    </a>
                );
            }
        }
        var unreads = this.props.comment.unreads;
        unreads = (unreads > 0) ? <div className="unread">{unreads}</div> : null;
        var stars = this.props.comment.stars;
        stars = (stars > 0) ? (
                <span className="fa-stack">
                <i className="fa fa-star fa-stack-1x"></i>
                <span className="star"><i className="fa fa-star fa-stack-1x"></i></span>
                </span>
        ) : null;
        return (
                <td {...props}>
                <div className="notify">{unreads}{stars}</div>
                {content}{edit}
                </td>
        );
    }
});
