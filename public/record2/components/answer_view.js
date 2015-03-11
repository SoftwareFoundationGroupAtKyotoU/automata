var Hoge = React.createClass({
    getInitialState: function() {
        return {
            count: 0
        };
    },

    // componentWillMount: function() {
    //     console.log('will mount ' + this.props.count);
    // },

    // componentWillReceiveProps: function() {
    //     console.log('will receive ' + this.props.count);
    //     this.setState({
    //         count: this.props.count
    //     });
    // },
    componentDidMount: function() {
        console.log('did mount ' + this.props.count);
    },

    render: function() {
        return (
                <p>hoge: {this.props.count}</p>
        );
    }
});

var AnswerView = React.createClass({
    getInitialState: function() {
        return {
            a: 0
        };
    },

    componentDidMount: function() {
        setInterval(function() { this.setState({ a: this.state.a + 1 }) }.bind(this), 1000);
    },

    render: function() {
        return (
                <div className="status_window">
                <StatusHeader tabName='answer'/>
                <div className="status_view">AnswerView: 構築中</div>
                <p>{this.state.a}</p>
                <Hoge count={this.state.a}/>
                <p><p><div id="hogehoge">hogehoge</div></p></p>
                </div>
        );
    }
});
