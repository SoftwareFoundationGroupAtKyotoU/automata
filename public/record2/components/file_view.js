var FileView = React.createClass({
    render: function() {
        return (
                <div className="status_window">
                <StatusHeader tabName='file'/>
                <div className="status_view">FilesView: 構築中<br/>{this.props.token}<br/>{this.props.report}</div>
                </div>
        );
    }
});
