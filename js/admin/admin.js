var React = require('react');
var $ = require('jquery');

var EditableCellComponent = React.createClass({
    toggleEdit: function() {
        this.setState({
            editing: !this.state.editing
        });
    },

    onEdit: function() {
        var data = {
            method: 'modify',
            user: this.props.user
        };
        var text = this.refs.text.getDOMNode().value;
        data[this.props.label] = text;
        $.post('../api/admin_user.cgi',
               data,
               function() {
                   this.props.updateUserData(
                       this.props.user,
                       this.props.label,
                       text
                   );
               }.bind(this));
        this.setState({
            editing: false
        });
    },

    getInitialState: function() {
        return {
            editing: false
        };
    },

    render: function() {
        if (this.state.editing) {
            var cancel = React.DOM.a({
                href: 'javascript:void(0)',
                style: { textDecoration: 'none' },
                title: 'キャンセル',
                onClick: this.toggleEdit
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
        } else {
            var edit = React.DOM.a({
                href: 'javascript:void(0)',
                style: { textDecoration: 'none' },
                title: '変更する',
                onClick: this.toggleEdit
            }, '✏');
            return React.DOM.td(null, edit, ' ', this.props.text);
        }
    }
});

var EditableCell = React.createFactory(EditableCellComponent);

var DeleteCellComponent = React.createClass({
    onDelete: function() {
        if (confirm('really delete the following user?\n' + this.props.text)) {
            $.post('../api/admin_user.cgi',
                   {
                       method: 'delete',
                       user: this.props.text
                   },
                   function() {
                       this.props.delUser(this.props.text);
                   }.bind(this));
        }
    },

    render: function() {
        var del = React.DOM.a({
            href: 'javascript:void(0)',
            style: { textDecoration: 'none' },
            title: '削除する',
            onClick: this.onDelete
        }, '♲');
        return React.DOM.td(null, del, ' ', this.props.text);
    }
});

var DeleteCell = React.createFactory(DeleteCellComponent);

var UserComponent = React.createClass({
    render: function() {
        var cells = this.props.data.map(function(c) {
            if (c.label === 'login') {
                return DeleteCell({
                    key: c.label,
                    text: c.data,
                    delUser: this.props.delUser
                });
            } else {
                return EditableCell({
                    key: c.label,
                    user: this.props.login,
                    label: c.label,
                    text: c.data,
                    updateUserData: this.props.updateUserData
                });
            }
        }, this);
        return React.DOM.tr(null, cells);
    }
});

var User = React.createFactory(UserComponent);

var attrs = [
    { key: 'login', name: 'ID' },
    { key: 'name',  name: '名前' },
    { key: 'ruby',  name: 'ふりがな' },
    { key: 'email', name: 'メールアドレス' },
    { key: 'assigned', name: '担当TA' },
];

var UserTableComponent = React.createClass({
    updateUserData: function(user, key, data) {
        this.setState({
            users: this.state.users.map(function(u) {
                if (u.login === user) {
                    u[key] = data
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
        $.get('../api/user.cgi',
              {
                  email: true,
                  assigned: true
              },
              function(users) {
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
                        { key: x.key },
                        x.name
                    );
                })
            );
            var rows = this.state.users.map(function(u) {
                var data = attrs.map(function(x) {
                    return { label: x.key, data: u[x.key] };
                });
                return User({
                    key: u.token,
                    login: u.login,
                    data: data,
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
    render: function() {
        return React.DOM.div(
            null,
            React.DOM.h2(null, 'ユーザ管理'),
            UserTable(null)
        );
    }
});

var Admin = React.createFactory(AdminComponent);

React.render(Admin(null), document.body);
