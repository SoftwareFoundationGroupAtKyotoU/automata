var React = require('react');
var api = require('../api');
var exercise = require('../exercise');

var Report = React.createClass({
    getInitialState: function() {
        var checked_list = {};
        this.props.solved.forEach(function(ex) { checked_list[ex] = true; });
        return {
            checked: checked_list
        };
    },

    handleChange: function(exs, checked) {
        var checked_list = this.state.checked;
        exs.forEach(function(ex) { checked_list[ex] = checked; });
        this.setState({
            checked: checked_list
        });
    },

    onClick: function(e) {
        var checked_list = this.state.checked;
        var solved = Object.keys(checked_list).filter(function (ex) {
            return checked_list[ex];
        });

        api.post({
            api: 'admin_solved',
            data: {
                user: this.props.token,
                report: this.props.report,
                exercise: solved
            }
        }).done(function() { this.props.posted(); }.bind(this));
    },

    render: function() {
        var p = this.props;
        var s = this.state;

        return <div>
                   <div className="list_view">
                   <ul className="ex">
                       <exercise.CheckList prefix={'ex_' + p.report}
                                           exs={p.exercise_list}
                                           checkedExs={s.checked}
                                           onChange={this.handleChange} />
                   </ul>
                   </div>
                   <button onClick={this.onClick} >変更</button>
                   <button onClick={p.onCancel} >キャンセル</button>
               </div>;
    }
});

var AnswerEdit = React.createClass({

    getInitialState: function() {
        return {
            exercise_list: undefined,
        };
    },

    componentDidMount: function() {
        api.get({
            api: 'scheme',
            data: {
                id: this.props.report,
                exercise: true,
                action: 'get',
            }
        }).done(function(result) {
            this.setState({
                exercise_list: result[0].exercise
            });
        }.bind(this));
    },

    render: function() {
        if (!this.state.exercise_list) {
            return (
                    <div>
                    <div className="list_view">
                    <img src="./loading.gif" />
                    </div>
                    </div>
            );
        } else {
            return (
                    <Report token={this.props.token}
                            report={this.props.report}
                            solved={this.props.solved}
                            exercise_list={this.state.exercise_list}
                            onCancel={this.props.onCancel}
                            posted={this.props.posted} />
            );
        }
    }
});

module.exports = AnswerEdit;
