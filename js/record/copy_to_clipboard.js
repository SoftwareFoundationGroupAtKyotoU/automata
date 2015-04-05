var _ = require('lodash');
var $ = require('jquery');
var React = require('react');
var ZeroClipboard = require('zeroclipboard');
ZeroClipboard.config({ swfPath: '../image/ZeroClipboard.swf' });

module.exports = React.createClass({
    selectCode: function(e) {
        e.preventDefault();
        var range = document.createRange();
        range.selectNodeContents($(this.props.selector)[0]);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    },

    getInitialState: function() {
        return {
            fallback: false
        }
    },

    getDefaultProps: function() {
        return {
            text: ''
        }
    },

    componentDidMount: function() {
        this.client = new ZeroClipboard(this.refs.button.getDOMNode());
        this.client.on('ready', function() {
            this.client.on('copy', function(e) {
                e.clipboardData.setData('text/plain', this.props.text);
            }.bind(this));
        }.bind(this));
        this.client.on('error', function(e) {
            console.log(e);
            this.client.destroy();
            if (this.isMounted()) this.setState({ fallback: true });
        }.bind(this));
    },

    componentWillUnmount: function() {
        this.client.destroy();
    },

    render: function() {
        if (this.state.fallback) {
            if (_.isUndefined($(this.props.selector)[0])) {
                return null;
            } else {
                return (
                    <a title="ソースコードを選択"
                       href="javascript:void(0)"
                       onClick={this.selectCode}>
                        <i ref="button" className="fa fa-eyedropper"/>
                    </a>
                );
            }
        } else {
            return (
                <i ref="button" className="fa fa-clipboard clipboard"/>
            );
        }
    }
});
