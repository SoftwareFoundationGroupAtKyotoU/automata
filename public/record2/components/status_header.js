var React = require('react');
window.React = React;
var Router = require('react-router');
var Link = Router.Link;

module.exports = React.createClass({
    mixins: [Router.State],

    getDefaultProps: function() {
        return {
            toolBar: function() {
                return null;
            }
        };
    },

    render: function() {
        var _tabs = tabs.map(function(tab) {
            var className = 'status_tabbar_button';
            if (tab.path === this.props.tabName) {
                className += ' selected';
            }
            return (
                    <li className={className} key={tab.path}>
                    <Link to={tab.path} params={{
                        token: this.getParams().token,
                        report: this.getParams().report,
                    }}>{tab.name}</Link>
                    </li>
            );
        }.bind(this));
        return (
                <div className="status_header">
                {this.props.toolBar()}
                <ul className="status_tabbar">{_tabs}</ul>
                </div>
        );
    }
});
