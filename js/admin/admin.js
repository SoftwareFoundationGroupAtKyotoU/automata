var React = require('react');
var _ = require('lodash');
var api = require('../api');

api.modify = function(param) {
    var data = {
        method: 'modify',
        user: param.user
    };
    data[param.id] = param.value;

    return api.post({
        api: 'admin_user',
        data: data
    }).done(param.callback);
};

var createButton = function(text, icon) {
    return React.createFactory(React.createClass({
        render: function() {
            return React.DOM.a({
                href: 'javascript:void(0)',
                style: { textDecoration: 'none' },
                title: text,
                onClick: this.props.onClick
            }, icon);
        }
    }));
};

var EditButton = createButton('変更する', '✏');
var CancelButton = createButton('キャンセル', '✖');
var OKButton = createButton('実行', '✔');

var TextCellComponent = React.createClass({
    onEdit: function() {
        var text = this.refs.text.getDOMNode().value;
        api.modify({
            user:  this.props.user,
            id:    this.props.id,
            value: text,
            callback: function() {
                this.props.updateUserData(
                    this.props.user,
                    this.props.id,
                    text
                );
                this.setState({
                    editing: 'none'
                });
            }.bind(this)});

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
            var cancel = CancelButton({
                onClick: function() { this.setState({ editing: 'none' }); }.bind(this)
            });
            var ok = OKButton({
                onClick: this.onEdit
            });
            var textbox = React.DOM.input({
                type: 'text',
                ref: 'text',
                defaultValue: this.props.value,
                size: 40
            });
            return React.DOM.td(null, cancel, ' ', ok, ' ', textbox);
        } else if (this.state.editing === 'exec') {
            return React.DOM.td(
                null,
                React.DOM.img({ src: '../image/loading.gif' }),
                ' ',
                this.props.value
            );
        } else {
            var edit = EditButton({
                onClick: function() { this.setState({ editing: 'edit' }); }.bind(this)
            });
            return React.DOM.td(null, edit, ' ', this.props.value);
        }
    }
});

var TextCell = React.createFactory(TextCellComponent);

var DeleteCellComponent = React.createClass({
    onDelete: function() {
        if (confirm('really delete the following user?\n' + this.props.value)) {
            api.post({
                api: 'admin_user',
                data: {
                    method: 'delete',
                    user: this.props.value
                }
            }).done(function() {
                this.props.onDelete(this.props.value);
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
        return React.DOM.td(null, del, ' ', this.props.value);
    }
});

var DeleteCell = React.createFactory(DeleteCellComponent);

var SelectCellComponent = React.createClass({
    getInitialState: function() {
        return { editing: 'none' };
    },

    onChange: function(e) {
        var val = e.target.value;
        var p = this.props;
        api.modify({
            user:  p.user,
            id:    p.id,
            value: val,
            callback: function() {
                this.setState({ editing: 'none' });
                p.updateUserData(p.user, p.id, val);
            }.bind(this)
        });

        this.setState({
            editing: 'exec'
        });
    },

    render: function() {
        var p = this.props;
        if (this.state.editing === 'edit') {
            var options = p.values.map(function(v) {
                return React.DOM.option({
                    key: v,
                    value: v,
                }, v);
            });
            options.push(React.DOM.option({ value: '' }, '(なし)'));

            var select = React.DOM.select({
                defaultValue: p.value,
                onChange: this.onChange,
            }, options);

            var cancel = CancelButton({
                onClick: function() {
                    this.setState({ editing: 'none' });
                }.bind(this)
            });

            return React.DOM.td(null, cancel, ' ', select);
        } else if (this.state.editing === 'exec') {
            return React.DOM.td(
                null,
                React.DOM.img({ src: '../image/loading.gif' }),
                ' ',
                this.props.value
            );
        } else {
            var edit = EditButton({
                onClick: function() {
                    this.setState({ editing: 'edit' });
                }.bind(this)
            });
            return React.DOM.td(null, edit, ' ', this.props.value);
        }
    }
});

var SelectCell = React.createFactory(SelectCellComponent);

var attrs = [
    { id: 'login',    name: 'ID',             form: DeleteCell },
    { id: 'name',     name: '名前',           form: TextCell },
    { id: 'ruby',     name: 'ふりがな',       form: TextCell },
    { id: 'email',    name: 'メールアドレス', form: TextCell },
    { id: 'assigned', name: '担当TA',         form: SelectCell }
];

var UserComponent = React.createClass({
    find: function(data, id) {
        return _.find(data, function(x) { return x.id === id; });
    },

    render: function() {
        var p = this.props;
        var data = attrs.map(function(x) {
            return {
                user: p.user.login,
                id: x.id,
                value: p.user[x.id],
                form: x.form,
                key: x.id, /* for React */
                updateUserData: p.updateUserData
            };
        }.bind(this));

        this.find(data, 'login').onDelete = p.delUser;
        this.find(data, 'assigned').values = p.admins;

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
                    admins: this.props.admins,
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
                admin: true,
                all_admins: true
            }
        }).done(function(result) {
            this.setState({
                user: result.user,
                admin: result.admin,
                all_admins: result.all_admins
            });
        }.bind(this));
    },

    render: function() {
        if (this.state.admin) {
            return React.DOM.div(
                null,
                React.DOM.h2(null, 'ユーザ管理'),
                UserTable({ admins: this.state.all_admins })
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
