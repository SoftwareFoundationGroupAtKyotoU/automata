var React = require('react');
var api = require('../api');

var StatusCell = require('./status_cell.js');

module.exports = React.createClass({
    updateStatus: function(token, report, status) {
        this.setState({
            users: this.state.users.map(function(user) {
                if (user.token === token) {
                    user.report[report].status = status;
                }
                return user;
            })
        });
    },

    setUsers: function(users) {
        if (this.isMounted()) {
            this.setState({
                users: users
            });
        }
        if (users.length === 0) return;

        var tokens = users.map(function(user) { return user.token; });
        this.props.scheme.forEach(function(s) {
            api.get({
                api: 'comment',
                data: {
                    action: 'list_news',
                    report: s.id,
                    user: tokens
                }
            }).done(function(result) {
                Object.keys(result).map(function(key) {
                    var user = users.filter(function(user) {
                        return user.token === key;
                    })[0];
                    ['report', s.id, 'comment'].reduce(function(r, k) {
                        if (!r[k]) r[k] = {};
                        return r[k];
                    }, user);
                    user['report'][s.id]['comment'] = result[key];
                }, this);
                if (this.isMounted()) {
                    this.setState({
                        users: users,
                    });
                }
            }.bind(this));
        }, this);
    },

    componentDidMount: function() {
        if (this.props.users) {
            this.setUsers(this.props.users);
        } else {
            var data = {
                type: 'status',
            };
            if (this.props.token) data.user = this.props.token;
            if (this.props.filtered) data.filter = true;
            api.get({ api: 'user', data: data }).done(this.setUsers);
        }
    },

    render: function() {
        var scheme = this.props.scheme.map(function(s) {
            return {
                id: s.id,
                label: s.record.filter(function(r) {
                    return r.field === 'status';
                })[0].label
            };
        });
        var ths = scheme.map(function(s) {
            return (
                    <th>{s.label}</th>
            );
        });
        if (ths.length > 0) ths.unshift (<th>名前</th>);
        var users;
        if (this.state && this.state.users.length > 0) {
            users = this.state.users.map(function(user) {
                var kadais = scheme.map(function(s) {
                    var unreads = ['report', s.id, 'comment', 'unreads'].reduce(function(r, k) {
                        if (!r[k]) r[k] = {};
                        return r[k];
                    }, user);
                    return (<StatusCell user={user} report={s.id} isButton={true} admin={this.props.admin} updateStatus={this.updateStatus} unRead={unreads} isSelected={this.props.report === s.id}/>);
                }.bind(this));
                return (
                        <tr key={user.token}><td className="name">{user.name}</td>{kadais}</tr>
                );
            }.bind(this));

        // There are no users to show
        } else if (this.state) {
            users = <tr><td colSpan={ths.length}>
                        表示すべきユーザーはいません
                    </td></tr>;
        } else {
            users = (
                    <tr><td colSpan={ths.length}><img src="../image/loading.gif"/></td></tr>
            );
        }
        return (
                <table className="record">
                <thead>
                <tr>{ths}</tr>
                </thead>
                <tbody>
                {users}
                </tbody>
                </table>
        );
    }
});
