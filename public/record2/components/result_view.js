var React = require('react');

var UserModule = require('./user.js');
var StatusHeader = UserModule.userHeader;

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
