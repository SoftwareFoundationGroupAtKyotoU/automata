var React = require('react');

var AnswerEdit = require('./answer_edit.js');
var UserModule = require('./user.js');
var api = require('../api');
var Loading = require('../loading');

var Solved = React.createClass({
    render: function() {
        var solved = this.props.solved.map(function(s) {
            return (
                <li>{s}</li>
            );
        });
        return (
                <div>
                <h3>解答済み</h3>
                <ul>
                {solved}
                </ul>
                </div>
        );
    }
});

var Unsolved = React.createClass({
    render: function () {
        var unsolved;

        if (this.props.unsolved.length != 0) {
            unsolved = this.props.unsolved.map(function(us) {
                return (
                        <li>{us[0]}</li>
                );
            });
        } else {
            unsolved = (<li>なし</li>);
        }

        return (
                <div>
                <h3>未回答</h3>
                <ul>
                {unsolved}
                </ul>
                </div>
        );
    }
});

var AnswerView = React.createClass({
    mixins: [Loading.Mixin],

    getInitialState: function() {
        return {
            solved: [],
            unsolved: [],
            editMode: false,
            mounted: false
        };
    },

    componentDidMount: function() {
        api.get(
            {
                api: 'user',
                data: {
                    user: this.props.token,
                    report: this.props.report,
                    type: 'status',
                    status: 'solved'
                },
            }, {
                api: 'user',
                data: {
                    user: this.props.token,
                    report: this.props.report,
                    type: 'status',
                    status: 'record'
                }
            }).done(function(solved, unsolved) {
                if (typeof solved[0].report === 'undefined' || typeof unsolved[0].report === 'undefined') {
                    this.setState({
                        solved: [],
                        unsolved: [],
                        mounted: true
                    });
                } else {
                    this.setState({
                        solved: solved[0].report[this.props.report].solved,
                        unsolved: unsolved[0].report[this.props.report].unsolved,
                        mounted: true
                    });
                }
            }.bind(this));
    },

    editModeOff: function() { this.setState({ editMode: false }); },
    editModeOn: function() { this.setState({ editMode: true }); },

    toolBar: function() {
        return this.props.admin && (
                <ul className="status_toolbar">
                <li className="toolbutton">
                <a href="javascript:void(0)" onClick={this.editModeOn}><i className="fa fa-pencil-square-o"/> 編集</a>
                </li>
                </ul>
        );
    },

    posted: function() {
        this.setState({
            editMode: false,
            mounted: false
        });
        this.componentDidMount();
    },

    nowLoading: function() {
        return !this.state.mounted;
    },

    afterLoading: function() {
        if (this.state.editMode) {
            return <AnswerEdit token={this.props.token}
                               report={this.props.report}
                               solved={this.state.solved}
                               onCancel={this.editModeOff}
                               posted={this.posted} />;
        }
        else if (this.state.solved.length === 0) {
            return 'なし';
        }
        else {
            return [<Solved solved={this.state.solved}/>,
                    <Unsolved unsolved={this.state.unsolved}/>];
        }
    },

    render: function() {
        return <div>
                   <div className="status_header">{this.toolBar()}</div>
                   <div className="status_view">{this.renderLoading()}</div>
               </div>;
    }
});

module.exports = AnswerView;
