var React = require('react');

var StatusHeader = require('./status_header.js');

module.exports = React.createClass({
    render: function() {
        return (
                <div className="status_window">
                <StatusHeader tabName='result'/>
                <div className="status_view">ResultView: 構築中</div>
                </div>
        );
    }
});
