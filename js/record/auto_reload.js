var _ = require('lodash');
var React = require('react');
var $ = require('jquery');

var api = require('../api.js');

module.exports = React.createClass({
    updateUsers: function(updateUsers) {
        if (updateUsers.length === 0) return;
        this.props.setUsers(
            this.props.users.map(function(user) {
                var update = _.find(updateUsers, 'token', user.token);
                return _.isUndefined(update) ? user : update;
            })
        );
    },

    updateComments: function(updateComments) {
        var isUpdated = _.some(updateComments, function(comments, report_id) {
            return _.some(comments, function(c, user_token) {
                var now = _.chain(this.props.comments)
                           .result(report_id, {}).result(user_token, {})
                           .value();
                return now.unreads !== c.unreads || now.comments !== c.comments;
            }, this);
        }, this);
        if (isUpdated) {
            this.props.setComments(
                _.assign(this.props.comments, updateComments)
            );
        }
    },

    reload: function() {
        if (this.props.users.length === 0) return;

        var last = _.chain(this.props.users)
                    .map(function(user) {
                        return user.lastUpdate;
                    }).max().value();
        var tokens = this.props.users.map(_.partial(_.result, _, 'token'));

        $.when(
            $.ajax({
                url: '../api/user.cgi',
                data: {
                    type: 'status', status: 'record',
                    log: true, assigned: true, last: last
                },
                timeout: 300 * 1000
            }),
            $.ajax({
                url: '../api/comment.cgi',
                data: {
                    action: 'list_news',
                    user: tokens
                },
                timeout: 300 * 1000
            })
        ).done(function(users, comments) {
            if (this.isMounted()) this.setState({ request: 'done' });
            this.updateUsers(users[0]);
            this.updateComments(comments[0]);
        }.bind(this)).fail(function() {
            if (this.isMounted()) this.setState({ request: 'failed' });
        }.bind(this)).always(function() {
            if (this.isMounted() && this.props.interval > 0) {
                setTimeout(this.reload, this.props.interval);
            }
        }.bind(this));

        this.setState({ request: 'issue' });
    },

    getInitialState: function() {
        return { request: 'done' };
    },

    componentDidMount: function() {
        if (this.props.interval > 0) {
            setTimeout(this.reload, this.props.interval);
        }
    },

    render: function() {
        var color;
        switch (this.state.request) {
            case 'issue':
                color = 'lightsteelblue';
                break;
            case 'failed':
                color = 'red';
                break;
            default:
                color = 'green';
                break;
        }
        var loading = (this.state.request === 'issue') ?
                      (<i className="fa fa-refresh fa-spin"></i>) :
                      (<i className="fa fa-refresh"></i>)
        if (this.props.interval > 0) {
            return (
                <span title="自動更新:有効" style={{ color: color }}>{loading}</span>
            );
        } else {
            return null;
        }
    }
});
