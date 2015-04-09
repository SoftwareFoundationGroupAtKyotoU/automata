var React = require('react');

var icon = <i className="fa fa-spinner fa-pulse"/>;

module.exports = {
    Mixin: {
        renderLoading: function() {
            return this.nowLoading() ? icon : this.afterLoading();
        }
    },

    Icon: icon
};
