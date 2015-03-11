var LogView = React.createClass({
    getInitialState: function() {
        return {
            clicked: false,
            clicked2: false,
        };
    },

    onClick: function() {
        this.setState({
            clicked: !this.state.clicked
        });
    },

    onClick2: function() {
        this.setState({
            clicked2: !this.state.clicked2
        });
    },

    toolBar: function() {
        if (this.state.clicked2) {
        return (
                <ul className="status_toolbar">
                <li className="toolbutton"><a onClick={this.onClick}>✏ 編集</a></li>
                </ul>
        );
        } else {
            return (
                    <ul className="status_toolbar">
                    <li className="toolbutton">おされてん</li>
                    </ul>
            );
        }
    },

    render: function() {
        return (
                <div className="status_window">
                <StatusHeader tabName='log' toolBar={this.toolBar}/>
                <div className="status_view">LogView: 構築中 {this.state.clicked.toString()}<br/>
                <a onClick={this.onClick2}>push</a><br/>
                </div>
                </div>
        );
    }
});
