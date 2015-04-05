var hljs = require('highlight.js');
var React = require('react');

var Highlight = React.createClass({
    getDefaultProps: function() {
        return {
            className: ""
        };
    },
    componentDidMount: function () {
        this.highlightCode();
    },
    componentDidUpdate: function () {
        this.highlightCode();
    },
    highlightCode: function () {
        var node = this.getDOMNode();
        var codes = node.querySelectorAll('pre code');
        for (var i = 0; i < codes.length; i = i+1) {
            hljs.highlightBlock(codes[i]);
        }
    },
    render: function() {
        return (
            <div dangerouslySetInnerHTML={{__html: this.props.children}}
                 className={this.props.className}></div>
        );
    }
});

module.exports = Highlight;
