var React = require('react');
var _     = require('lodash');
var api   = require('../api');

var InteractView = React.createClass({
    getInitialState: function() {
        return {
            loading: false,
            input:   undefined,
            content: undefined
        };
    },

    onClick: function() {
        this.setState({ loading: true });

        api.get({
            api: 'admin_interact',
            data: {
                report: this.props.report,
                user: this.props.token,
                input: this.state.input
            }
        }).done(function(response) {
            this.setState({
                loading: false,
                response: response.split("\n")
            });
        }.bind(this)).fail(function() {
            this.setState({
                loading: false,
                response: undefined
            });
        }.bind(this));
    },

    onChange: function(e) {
        this.setState({ input: e.target.value });
    },

    render: function() {
        if (!InteractView.visible(this.props)) return <div />;

        var sendButton;
        var response;

        if (this.state.loading) {
            sendButton = <i className="fa fa-spinner fa-pulse"/>;
        }
        else {
            sendButton = <a href='javascript:void(0)' onClick={this.onClick}>送信</a>;
        }

        if (_.isUndefined(this.state.response)) {
            response = undefined;
        }
        else {
            var res = this.state.response.map(function(r) { return [r, <br />]; });
            response = <div className="response">{res}</div>;
        }

        return <div className="interact">
                   <div className="status_header" />
                   <div className="status_view">
                       <textarea cols='80' rows='10' value={this.state.input}
                                 onChange={this.onChange} />
                       {sendButton}
                       {response}
                   </div>
               </div>;
    },

    statics: {
        visible: function(params) {
            return params.admin && params.interact;
        }
    }
});

module.exports = InteractView;
