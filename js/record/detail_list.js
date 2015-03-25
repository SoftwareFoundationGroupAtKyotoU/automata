var React = require('react');
window.React = React;
var Router = require('react-router');
var api = require('../api');

var StatusCell = require('./status_cell.js');

var OptionalCell = React.createClass({
    getInitialState: function() {
        return {
            expand: false,
        };
    },

    toggleDetail: function() {
        this.setState({
            expand: !this.state.expand
        });
        return false;
    },

    render: function() {
        var content;
        if (this.props.answered.length > 0) {
            var detail = this.props.answered.length;
            if (this.state.expand) {
                detail = this.props.answered.join(', ');
            }
            content = (
                    <a href="javascript:void(0)" onClick={this.toggleDetail}>
                    {detail}
                    </a>
            );
        }
        return (
                <td className={this.props.name}>
                {content}
                </td>
        );
    }
});

var ReportList = React.createClass({
    mixins: [Router.Navigation],

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

    componentDidMount: function() {
        var data = {
            type: 'status',
            report: this.props.scheme.id,
            status: 'record',
            log: true
        };
        if (this.props.filtered) data.filter = true;
        api.get({
            api: 'user',
            data: data
        }).done(function(users) {
            this.setState({
                users: users,
            });
            if (users.length === 0) return;

            var tokens = users.map(function(user) { return user.token; });
            api.get({
                api: 'comment',
                data: {
                    action: 'list_news',
                    report: this.props.scheme.id,
                    user: tokens
                }
            }).done(function(comments) {
                Object.keys(comments).map(function(key) {
                    var user = users.filter(function(user) {
                        return user.token === key;
                    })[0];
                    ['report', this.props.scheme.id, 'comment'].reduce(function(r, k) {
                        if (!r[k]) r[k] = {};
                        return r[k];
                    }, user);
                    user['report'][this.props.scheme.id]['comment'] = comments[key];
                }, this);
                this.setState({
                    users: users
                });
            }.bind(this));
        }.bind(this));
    },

    render: function() {
        var ths = this.props.scheme.record.map(function(r) {
            return (
                    <th className={r.field}>{r.label}</th>
            );
        });
        var users;
        if (this.state && this.state.users.length > 0) {
            users = this.state.users.map(function(user) {
                var tds = this.props.scheme.record.map(function(r) {
                    if (r.field === 'name') {
                        var unreads = ['report', this.props.scheme.id, 'comment', 'unreads'].reduce(function(r, k) {
                            if (!r[k]) r[k] = {};
                            return r[k];
                        }, user);
                        if (unreads > 0) {
                            unreads = (<div className="unread">{unreads}</div>);
                        }
                        return (<td className="name">{unreads}{user.name}</td>);
                    } else if (r.field === 'status') {
                        return (<StatusCell user={user} report={this.props.scheme.id} admin={this.props.admin} updateStatus={this.updateStatus}/>);
                    } else if (/^optional/.test(r.field)) {
                        var answered = ['report', this.props.scheme.id, 'optional'].reduce(function(r, k) {
                            if (typeof r[k] === 'undefined') r[k] = {};
                            return r[k];
                        }, user);
                        if (!Array.isArray(answered)) answered = [];
                        return (<OptionalCell name={r.field} answered={answered}/>);
                    } else if (r.field === 'unsolved') {
                        var unsolved = ['report', this.props.scheme.id, 'unsolved'].reduce(function(r, k) {
                            if (typeof r[k] === 'undefined') r[k] = {};
                            return r[k];
                        }, user);
                        if (!Array.isArray(unsolved)) unsolved = [];
                        var str = unsolved.map(function(l) {
                            var r = l[0];
                            if (l[1] > 1) r += 'のうち残り' + l[1] + '問';
                            return r;
                        }).join(', ');
                        return (<td className="unsolved">{str}</td>);
                    } else if (r.field === 'test') {
                        var test = ['report', this.props.scheme.id, 'log', 'test'].reduce(function(r, k) {
                            if (!r[k]) r[k] = {};
                            return r[k];
                        }, user);
                        var str;
                        if ('passed' in test && 'number' in test) {
                            str = test.passed + '/' + test.number;
                        }
                        return (<td className="test">{str}</td>);
                    } else {
                        return (<td></td>);
                    }
                }.bind(this));
                var transTo = function() {
                    this.transitionTo('user', {
                        token: user.token,
                        report: this.props.scheme.id,
                    });
                }.bind(this);
                return (
                        <tr className="selectable" onClick={transTo}>{tds}</tr>
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

var DetailList = React.createClass({
    render: function() {
        var reports = this.props.scheme.map(function(s) {
            return (
                    <ReportList scheme={s} admin={this.props.admin} filtered={this.props.filtered}/>
            );
        }.bind(this));
        return (
                <div className="view">{reports}</div>
        );
    }
});

module.exports = DetailList;
