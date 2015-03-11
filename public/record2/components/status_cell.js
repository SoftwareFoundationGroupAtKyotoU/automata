var StatusCell = React.createClass({
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

    edit: function() {
        this.setState({
            editing: !this.state.editing
        });
        return false;
    },

    changeState: function(e) {
        var id = ['report', this.props.report, 'submit'].reduce(function(r, k) {
            if (typeof r[k] === 'undefined') r[k] = {};
            return r[k];
        }, this.props.user);
        $.post('../api/admin_log.cgi',
               {
                   id: id,
                   user: this.props.user.token,
                   report: this.props.report,
                   status: e.target.value
               },
               function(result) {
                   this.props.updateStatus(this.props.user.token,
                                           this.props.report);
               }.bind(this));
        this.setState({
            editing: false
        });
    },

    disable: function() {
        return false;
    },

    getDefaultProps: function() {
        return {
            unRead: 0
        };
    },

    getInitialState: function() {
        return {
            editing: false,
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
        var content = this.status_map[status];
        if (this.state.editing) {
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
        }
        var edit;
        if (this.props.admin) {
            edit = (
                    <a className="edit" href="javascript:void(0)" title="変更する" onClick={this.edit}>✏</a>
            );
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
