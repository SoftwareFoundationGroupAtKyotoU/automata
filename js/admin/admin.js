var React = require('react');
var _ = require('lodash');
var api = require('../api');

var TextCellComponent = React.createClass({
    onEdit: function() {
        var data = {
            method: 'modify',
            user: this.props.user
        };
        var text = this.refs.text.getDOMNode().value;
        data[this.props.id] = text;
        api.post({
            api: 'admin_user',
            data: data
        }).done(function() {
            this.props.updateUserData(
                this.props.user,
                this.props.id,
                text
            );
            this.setState({
                editing: 'none'
            });
        }.bind(this));
        this.setState({
            editing: 'exec'
        });
    },

    getInitialState: function() {
        return {
            editing: 'none'
        };
    },

    render: function() {
        if (this.state.editing === 'edit') {
            var cancel = React.DOM.a({
                href: 'javascript:void(0)',
                style: { textDecoration: 'none' },
                title: 'キャンセル',
                onClick: function() { this.setState({ editing: 'none' }); }.bind(this)
            }, '✖');
            var ok = React.DOM.a({
                href: 'javascript:void(0)',
                style: { textDecoration: 'none' },
                title: '実行',
                onClick: this.onEdit
            }, '✔');
            var textbox = React.DOM.input({
                type: 'text',
                ref: 'text',
                defaultValue: this.props.text,
                size: 40
            });
            return React.DOM.td(null, cancel, ' ', ok, ' ', textbox);
        } else if (this.state.editing === 'exec') {
            return React.DOM.td(
                null,
                React.DOM.img({ src: '../image/loading.gif' }),
                ' ',
                this.props.text
            );
        } else {
            var edit = React.DOM.a({
                href: 'javascript:void(0)',
                style: { textDecoration: 'none' },
                title: '変更する',
                onClick: function() { this.setState({ editing: 'edit' }); }.bind(this)
            }, '✏');
            return React.DOM.td(null, edit, ' ', this.props.text);
        }
    }
});

var TextCell = React.createFactory(TextCellComponent);

var DeleteCellComponent = React.createClass({
    onDelete: function() {
        if (confirm('really delete the following user?\n' + this.props.text)) {
            api.post({
                api: 'admin_user',
                data: {
                    method: 'delete',
                    user: this.props.text
                }
            }).done(function() {
                this.props.onDelete(this.props.text);
            }.bind(this));
            this.setState({
                deleting: 'exec'
            });
        }
    },

    getInitialState: function() {
        return {
            deleting: 'none'
        };
    },

    render: function() {
        var del;
        if (this.state.deleting === 'none') {
            del = React.DOM.a({
                href: 'javascript:void(0)',
                style: { textDecoration: 'none' },
                title: '削除する',
                onClick: this.onDelete
            }, '♲');
        } else {
            del = React.DOM.img({
                src: '../image/loading.gif'
            });
        }
        return React.DOM.td(null, del, ' ', this.props.text);
    }
});

var DeleteCell = React.createFactory(DeleteCellComponent);

var attrs = [
    { id: 'login',    name: 'ID',             form: 'delete' },
    { id: 'name',     name: '名前',           form: 'text' },
    { id: 'ruby',     name: 'ふりがな',       form: 'text' },
    { id: 'email',    name: 'メールアドレス', form: 'text' },
    { id: 'assigned', name: '担当TA',         form: 'text' },
];

var UserComponent = React.createClass({
    createCellComponent: function(x) {
        switch (x) {
        case 'delete': return DeleteCell;
        case 'text':   return TextCell;
        default: return undefined;
        }
    },

    find: function(data, id) {
        return _.find(data, function(x) { return x.id === id; });
    },

    render: function() {
        var p = this.props;
        var data = attrs.map(function(x) {
            return {
                user: p.user.login,
                id: x.id,
                text: p.user[x.id],
                form: this.createCellComponent(x.form),
                key: x.id, /* for React */
                updateUserData: p.updateUserData
            };
        }.bind(this));

        this.find(data, 'login').onDelete = p.delUser;

        return React.DOM.tr(null, data.map(function(d) { return d.form(d); }));
    }
});

var User = React.createFactory(UserComponent);

var UserTableComponent = React.createClass({
    updateUserData: function(user, id, data) {
        this.setState({
            users: this.state.users.map(function(u) {
                if (u.login === user) {
                    u[id] = data
                }
                return u
            })
        });
    },

    delUser: function(user) {
        this.setState({
            users: this.state.users.filter(function(u) {
                return u.login !== user
            })
        });
    },

    getInitialState: function() {
        return {};
    },

    componentDidMount: function() {
        api.get({
            api: 'user',
            data: {
                email: true,
                assigned: true
            }
        }).done(function(users) {
            this.setState({
                users: users
            })
        }.bind(this));
    },

    render: function() {
        if (this.state.users) {
            var header = React.DOM.tr(
                null,
                attrs.map(function(x) {
                    return React.DOM.th(
                        { key: x.id },
                        x.name
                    );
                })
            );
            var rows = this.state.users.map(function(u) {
                return User({
                    key: u.token,
                    user: u,
                    updateUserData: this.updateUserData,
                    delUser: this.delUser
                });
            }, this);
            return React.DOM.table(
                null,
                React.DOM.thead(null, header),
                React.DOM.tbody(null, rows)
            );
        } else {
            return null;
        }
    }
});

var UserTable = React.createFactory(UserTableComponent);

var AdminComponent = React.createClass({
    getInitialState: function() {
        return {};
    },

    componentDidMount: function() {
        api.get({
            api: 'master',
            data: {
                user: true,
                admin: true
            }
        }).done(function(result) {
            this.setState({
                user: result.user,
                admin: result.admin
            });
        }.bind(this));
    },

    render: function() {
        if (this.state.admin) {
            return React.DOM.div(
                null,
                React.DOM.h2(null, 'ユーザ管理'),
                UserTable(null)
            );
        } else if (this.state.admin === false) {
            return React.DOM.div(
                null,
                React.DOM.h2(null, '権限がありません')
            );
        } else {
            return React.DOM.div(
                null,
                React.DOM.img({
                    src: '../image/loading.gif'
                })
            );
        }
    }
});

var Admin = React.createFactory(AdminComponent);

React.render(Admin(null), document.body);
