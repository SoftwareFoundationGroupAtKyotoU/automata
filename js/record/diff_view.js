var _ = require('lodash');
var React = require('react');
var Router = require('react-router');
var $ = require('jquery');
var api = require('../api');
var Loading = require('../loading');

var DiffView =(function() {
    return React.createClass({
        mixins: [Loading.Mixin],
        
        getInitialState: function() {
            return {
                init: false,
                selected: "please select"
            };
        },

        handleSelectChange: function(selected) {
            this.setState({ selected: selected });
        },
        
        componentDidMount: function() {
            var data = {
                user: this.props.token,
                report: this.props.report
            };
            api.get(
                {
                    api: 'diff',
                    data: data
                }
            ).done(function(result) {
                list = result.list;
                this.setState({
                    init: true,
                    submit_id_list: list,
                    selected: list[0]
                });
            }.bind(this));
        },

        nowLoading: function() {
            return !this.state.init;
        },

        afterLoading: function() {
            if (this.state.submit_id_list.length < 1) {
                return 'なし';
            }

            var p = this.props;
            var s = this.state;

            render = [(<DiffSelector
                       token={p.token}
                       report={p.report}
                       submit_id_list={s.submit_id_list}
                       selected={s.selected}
                       onSelectChange={this.handleSelectChange} />)];
            render.push(<DiffViewer
                        token={p.token}
                        report={p.report}
                        time={s.selected}/>);
            return <div>{render}</div>;
        },

        render: function() {
            return <div id={'status_view'} className="status_view">
                {this.renderLoading()}
            </div>;
        }
        
    });
})();

// This dropdown menu is considerably referred to
// https://www.codementor.io/reactjs/tutorial/create-a-dropdown-using-react-js--font-awesome-and-less-css

var DiffSelector = React.createClass({
    getInitialState: function() {
        return {
            listVisible: false
        };
    },
    
    select: function(time) {
        this.props.onSelectChange(time);
    },

    show: function() {
        this.setState({ listVisible: true });
        $(document).on("click", this.hide);
    },

    hide: function() {
        this.setState({ listVisible: false });
        $(document).off("click", this.hide);
    },

    render: function() {
        var s = this.state
        var p = this.props
        render = (
                <div className={"dropdown-container" + (s.listVisible ? " show" : "")}>
                <div className={"dropdown-display" + (s.listVisible ? " clicked": "")} onClick={this.show}>
                <span>{p.selected}</span>
                <i className="fa fa-angle-down"></i>
                </div>
                <div className="dropdown-list">
                <div>
                {this.renderListItems()}
            </div>
                </div>
                </div>
        );
        return render;
    },

    renderListItems: function() {
        var self = this;
        var items = this.props.submit_id_list.map(
            function(item){
                return (<div onClick={self.select.bind(null, item)}>
                        <span>{item}</span>
                        </div>);
            });
        return items;
    }
});

var DiffViewer = (function() {
    return React.createClass({
        mixins: [Loading.Mixin],

        open: function(time) {
            var data = {
                user: this.props.token,
                report: this.props.report,
                time: time
            };
            api.get({
                api: 'diff',
                data: data,
                ownError: true
            }).done(function(result) {
                var newState = {
                    time: time,
                    mode: 'show',
                    content: result
                };
                this.setState(newState);
            }.bind(this)).fail(function() {
                this.setState({
                    mode: 'error'
                });
            }.bind(this));
            
            this.setState({
                mode: 'loading'
            })
        },

        getInitialState: function() {
            return {
                mode: 'loading'
            };
        },

        componentDidMount: function() {
            this.open(this.props.time)
        },

        componentWillReceiveProps: function(nextProps) {
            this.open(nextProps.time)
        },

        nowLoading: function() {
            return this.state.mode === 'loading';
        },

        afterLoading: function() {
            var s = this.state;

            switch (s.mode) {
            case 'show':
                render = [(<DiffArrange content={s.content}/>)];
                break;
            case 'loading':
                render = '読み込み中';
                break;
            default:
                render = 'エラー';
            }

            return render;
        },

        render: function() {
            var p = this.props;
            
            return (<div id={"diff-" + p.report + "status_window"}
                    style={ {display: "block"} }>
                    <div id={"diff-" + p.report + "status_view"}
                    className="status_view">
                    {this.renderLoading()}
                    </div>
                    </div>);
        }
    });
})();    

var DiffArrange = (function() {
    return React.createClass({
        render: function() {
            var content = this.props.content;

            var tds = [
                    <td className="content"><pre dangerouslySetInnerHTML={
                        {__html: content }
                    }/></td>
            ];

            return <table className="file_browser file"><tr>{tds}</tr></table>;
        }
    });
})();

module.exports = DiffView;
