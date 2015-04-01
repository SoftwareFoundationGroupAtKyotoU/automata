var _ = require('lodash');
var React = require('react');
var Router = require('react-router');
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var Route = Router.Route;
var RouteHandler = Router.RouteHandler;
var api = require('../api');

var CommentForm = require('./comment_form.js');
var Highlight = require('./highlight.js');

var ACL_MESSAGE_FOR_ALL      = "全員に公開";
var ACL_MESSAGE_FOR_USER     = "提出者に公開";
var ACL_MESSAGE_FOR_OTHER    = "提出者以外に公開";
var ACL_MESSAGE_FOR_PRIVATE  = "非公開";

var Comment = React.createClass({
    getInitialState: function() {
        return {
            mode: 'normal',
        };
    },
    setMode: function(mode_text) {
        if (this.isMounted()) this.setState({ mode: mode_text });
    },
    normalMode: function()        { this.setMode('normal'); },
    editMode: function()          { this.setMode('editing'); },

    isMode: function(mode_text) {
        return this.state.mode === mode_text;
    },
    isNormalMode: function()      { return this.isMode('normal'); },
    isEditMode: function()        { return this.isMode('editing'); },

    acl: function(u) {
        return _.some(this.props.comment.acl, function(s) { return s === u; });
    },

    getAclMessage: function() {
        var userFlag = this.acl('user');
        var otherFlag = this.acl('other');
        if (userFlag && otherFlag) {
            return ACL_MESSAGE_FOR_ALL;
        } else if (userFlag) {
            return ACL_MESSAGE_FOR_USER;
        } else if (otherFlag) {
            return ACL_MESSAGE_FOR_OTHER;
        } else {
            return ACL_MESSAGE_FOR_PRIVATE;
        }
    },

    modifyComment: function(action, post) {
        api.post({
            api: 'comment',
            data: {
                user: [this.props.token],
                report: this.props.report,
                action: action,
                id: this.props.comment.id
            }
        }).done(function() {
            post();
            this.normalMode();
        }.bind(this));

        this.setState({ mode: 'modifying' });
    },

    onUnread: function() {
        this.modifyComment('unread', function() {
            this.props.setRead(false)
        }.bind(this));
    },

    onStar: function() {
        var flag = !this.props.comment.starFlag;
        this.modifyComment(flag ? 'star' : 'unstar', function() {
            this.props.setStar(flag);
        }.bind(this));
    },

    onDelete: function() {
        var text = 'このコメント['
                    + this.props.comment.user
                    + ': ' + this.props.comment.timestamp
                    + ']を削除しますか？';
        if (window.confirm(text)) {
            this.modifyComment('delete', function() {
                this.props.deleteComment();
            }.bind(this));
        }
    },

    onEdit: function() {
        api.get({
            api: 'comment',
            data: {
                user: [this.props.token],
                report: this.props.report,
                id: this.props.comment.id,
                action: 'get',
                type: 'raw'
            }
        }).done(function(result) {
            if (this.isMounted()) {
                this.setState({
                    rawHTML: result[0].content,
                    mode: 'editing'
                })
            }
        }.bind(this));
    },

    reloadComment: function() {
        api.get({
            api: 'comment',
            data: {
                user: [this.props.token],
                report: this.props.report,
                action: 'get',
                id: this.props.comment.id,
            }
        }).done(function(result) {
            this.props.rerender(result[0]);
            this.normalMode();
        }.bind(this));

        this.setState({
            mode: 'reloading'
        })
    },

    onCancel: function() {
        this.normalMode();
    },

    render: function() {
        var comment_box;
        switch (this.state.mode) {
            case 'editing':
                comment_box = (
                    <CommentForm admin={this.props.admin}
                                 token={this.props.token}
                                 report={this.props.report}
                                 comment_id={this.props.comment.id}
                                 defaultText={this.state.rawHTML}
                                 aclUserFlag={this.acl('user')}
                                 aclOtherFlag={this.acl('other')}
                                 afterSubmit={this.reloadComment}
                                 onCancel={this.onCancel}/>
                );
                break;
            case 'reloading':
                comment_box = (
                    <div className="form"><i className="fa fa-spinner fa-pulse"/></div>
                );
                break;
            default:
                comment_box = (
                    <div className="form">
                        <Highlight className="message">
                            {this.props.comment.content}
                        </Highlight>
                    </div>
                );
                break;
        }

        var editButtons;
        if (this.props.admin || this.props.comment.user === this.props.loginUser) {
            var buttons = [
                {
                    title: '未読にする',
                    handler: this.onUnread,
                    icon: 'fa-eye-slash',
                    hidden: !_.result(this.props.comment, 'readFlag', true)
                },
                {
                    title: this.props.comment.starFlag ? "印を外す" : "印を付ける",
                    handler: this.onStar,
                    icon: this.props.comment.starFlag ? "fa-star" : "fa-star-o",
                },
                {
                    title: '編集する',
                    handler: this.onEdit,
                    icon: 'fa-pencil-square-o'
                },
                {
                    title: '削除する',
                    handler: this.onDelete,
                    icon: 'fa-times'
                }
            ].map(function(p, i) {
                var handler = function(e) {
                    e.preventDefault();
                    p.handler(e);
                }
                var icon = 'fa ' + p.icon;
                var style = {
                    visibility: p.hidden ? 'hidden' : 'visible'
                }
                if (this.isNormalMode()) {
                    return (
                        <a key={i} style={style} href="javascript:void(0)" title={p.title} onClick={handler}>
                            <i className={icon}/>
                        </a>
                    );
                } else {
                    style.color = '#9a9';
                    return (
                        <a key={i} style={style} title={p.title}>
                            <i className={icon}/>
                        </a>
                    );
                }
            }.bind(this));
            editButtons = (
                <p className="edit">{buttons}</p>
            );
        }

        var div_meta = (
            <div className="meta">
                <p className="author">{this.props.comment.user_name}</p>
                <p className="acl">{this.getAclMessage()}</p>
                <p className="date">{this.props.comment.timestamp}</p>
                {editButtons}
            </div>
        );
        if (this.acl('user') || this.acl('other')) {
            return (
                <li>{div_meta}{comment_box}</li>
            );
        } else {
            return (
                <li className="private">{div_meta}{comment_box}</li>
            );
        }
    }
});

var CommentView = React.createClass({
    updateNews: function() {
        var unreads = 0;
        var comments = 0;
        var stars = 0;
        this.state.comments.forEach(function(comment) {
            comments++;
            if (!comment.readFlag) unreads++;
            if (comment.starFlag) stars++;
        });
        this.props.updateNews({
            unreads: unreads, comments: comments, stars: stars
        });
    },

    setStar: function(id, flag) {
        this.state.comments.forEach(function(comment) {
            if (comment.id === id) comment.starFlag = flag;
        });
        this.setState({ comments: this.state.comments });
        this.updateNews();
    },

    setRead: function(id, flag) {
        this.state.comments.forEach(function(comment) {
            if (comment.id === id) comment.readFlag = flag;
        });
        this.setState({ comments: this.state.comments });
        this.updateNews();
    },

    deleteComment: function(id) {
        this.setState({
            comments: _.reject(this.state.comments, 'id', id)
        });
        this.updateNews();
    },

    replaceComment: function(comment) {
        this.setState({
            comments: this.state.comments.map(function(prev_comment) {
                if (comment.id === prev_comment.id) {
                    if (_.isUndefined(comment.readFlag)) {
                        comment.readFlag = prev_comment.readFlag;
                    }
                    return comment;
                } else {
                    return prev_comment;
                }
            })
        });
        this.updateNews();
    },

    refleshComments: function() {
        api.get({
            api: 'comment',
            data: {
                user: [this.props.token],
                report: this.props.report,
                action: 'get'
            }
        }).done(function(result) {
            var last_id;
            result.forEach(function(comment) { last_id = comment.id; });
            if (!_.isUndefined(last_id)) {
                api.post({
                    api: 'comment',
                    data: {
                        user: [this.props.token],
                        report: this.props.report,
                        action: 'read',
                        id: last_id
                    }
                }).done(function() {
                    this.state.comments.forEach(function(comment) {
                        if (comment.id <= last_id) comment.readFlag = true;
                    });
                    if (this.isMounted()) {
                        this.setState({ comments: this.state.comments });
                    }
                    this.updateNews();
                }.bind(this));
            }

            this.setState({ comments: result });
        }.bind(this));
    },

    getInitialState: function() {
        return {
            comments: []
        }
    },

    componentDidMount: function() {
        this.refleshComments();
    },

    render: function() {
        var comments = this.state.comments.map(function(comment) {
            return (
                <Comment comment={comment} admin={this.props.admin}
                         token={this.props.token} report={this.props.report}
                         setStar={_.partial(this.setStar, comment.id)}
                         setRead={_.partial(this.setRead, comment.id)}
                         deleteComment={_.partial(this.deleteComment, comment.id)}
                         rerender={this.replaceComment}
                         key={comment.id}
                         loginUser={this.props.loginUser}/>
            );
        }.bind(this));

        return (
            <div>
                <div className="status_view">
                    <ul className="comments">
                        {comments}
                        <li>
                            <CommentForm admin={this.props.admin}
                                         token={this.props.token}
                                         report={this.props.report}
                                         afterSubmit={this.refleshComments} />
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
});

module.exports = CommentView;
