var React = require('react');
var $ = require('jquery');

module.exports = React.createClass({
    visible: false,
    offset: '0px',

    scrollTop: function() {
        $('html, body').animate({
            scrollTop: 0
        }, 100);
    },

    onScroll: function(e) {
        var pos = $(window).scrollTop();
        var nav = $(this.refs.nav.getDOMNode());
        if (!this.visible && pos > 150) {
            this.visible = true;
            nav.animate({
                right: '0px'
            }, 100);
        } else if (this.visible && pos <= 150) {
            this.visible = false;
            nav.animate({
                right: this.offset
            }, 100);
        }
    },

    componentDidMount: function() {
        var nav = $(this.refs.nav.getDOMNode());
        this.offset = '-' + nav.width() + 'px';
        nav.css('right', this.offset);
        nav.css('visibility', 'visible');
        $(window).on('scroll', this.onScroll);
    },

    componentWillUnmount: function() {
        $(window).off('scroll', this.onScroll);
    },

    render: function() {
        return (
                <div className="nav" ref="nav">
                <div className="button" onClick={this.scrollTop}>🔝</div>
                <div className="tag">{this.props.name}</div>
                </div>
        );
    }
});
