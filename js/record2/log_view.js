var React = require('react');
var $ = require('jquery');

var Log = React.createClass({
    render: function() {
        var defs = [
            { prop: 'timestamp',
              label: 'ステータス更新日時'
            },
            { prop: 'submit',
              label: '提出日時'
            },
            { prop: 'initial_submit',
              label: '初回提出'
            }
        ];
        var rawData = this.props.data;
        var data = [];
        defs.forEach(function(def) {
            data.push(<dt className={def.prop}>{def.label}</dt>);
            data.push(<dd className={def.prop}>{rawData[def.prop]}</dd>);
        });
        return (<dl className="log_msg">{data}</dl>);
    }
});

var LogMessages = React.createClass({
    render: function (){
        var trim = function (x){
            return x.trim();
        };
        var defs = [
            // {message: '...', reason: ''}
            { prop: 'message',
              label:'メッセージ',
              proc: trim },
            { prop: 'error',
              label: 'エラー',
              proc: trim },
            { prop: 'reason',
              label: 'エラーの詳細',
              proc: trim },
            // {build: 'OK'}
            { prop: 'build',
              label: 'build',
              proc: trim },
            // {test: {passed: 0, number: 0}}
            { prop: 'test',
              label: 'テスト通過率',
              proc: function(l){
                  return (l.passed +'/'+ l.number);}
            }
        ];
        var rawLog = this.props.log;
        var messages = [];
        if (rawLog) {
            defs.forEach(function(def) {
                if (rawLog[def.prop]) {
                    messages.push(<dt className={def.prop}>{def.label}</dt>);
                    messages.push(<dd className={def.prop}>{def.proc(rawLog[def.prop])}</dd>);
                }
            });
        }
        return (<dl className="log_msg">{messages}</dl>);
    }
});

var LogEdit = React.createClass ({
    getInitialState: function (){
        return {
            report: this.props.rep,
            user: this.props.token,
            id: this.props.id,
            message: this.props.data.message,
            error: this.props.data.error,
            reason: this.props.data.reason
        };
    },

    handleSubmit: function (e){
        $.post('../api/admin_log.cgi',
               this.state,
               function (d) {return;},
               function(xhr, status, err) {
                   console.error(status, err.toString());
               }.bind(this));
        this.props.exit();
    },

    handleChangeM: function (e) {
        this.setState({
            message: e.target.value,
                      });
    },
    handleChangeE: function (e) {
        this.setState({
            error: e.target.value,
        });
    },
    handleChangeR: function (e) {
        this.setState({
            reason: e.target.value,
        });
    },

    render: function (){
        var defs = [
            // {build: 'OK'}
            { prop: 'build',
              label: 'build',
              proc: function(x){if (x !== '') { return x; }}
            },
            // {test: {passed: 0, number: 0}}
            { prop: 'test',
              label: 'テスト通過率',
              proc: function(l){
                  return (l.passed +'/'+ l.number);}
            }];
        var rawLog = this.props.data;
        var test;
        if (rawLog) {
            test = defs.map(
                function (def) {
                    if (rawLog[def.prop]) {
                        return (
                                <div>
                                <dt className={def.prop}>{def.label}</dt>
                                <dd className={def.prop}>{def.proc(rawLog[def.prop])}</dd>
                                </div>);
                    } else {
                        return (<div></div>);
                    }
                });
        } else {
            test = (<div></div>);
        }
        return (
                <div className='form'>
                <dl className="log_msg">
                <dt className='message'>メッセージ</dt>
                <dd className='message'>
                <textarea rows='2' cols='80' onChange={this.handleChangeM} defaultValue={this.props.data.message} />
                </dd>
                <dt className='error'>エラー</dt>
                <dd className='error'>
                <textarea rows='2' cols='80' onChange={this.handleChangeE} defaultValue={this.props.data.error} />
                </dd>
                <dt className='reason'>エラーの詳細</dt>
                <dd className='reason'>
                <textarea rows='2' cols='80' onChange={this.handleChangeR} defaultValue={this.props.data.reason} />
                </dd>
                {test}
                </dl>
                <input type='submit' onClick={this.handleSubmit} value='変更' />
                <input type='button' onClick={this.props.exit} value='キャンセル' />
                </div>
        );
    }
});

var LogView = React.createClass({
    getInitialState: function(){
        return {
            init: false,
            onEdit: false
        };
    },

    componentDidMount: function () {
        $.get('../api/user.cgi',
              {
                  user: this.props.token,
                  type: 'status',
                  status: 'record',
                  log : true,
                  report: this.props.report
              },
              function(result) {
                  if (result[0].report) {
                      this.setState({
                          data: (result[0].report[this.props.report]),
                          init: true
                      });
                  } else {
                      this.setState({
                          init: true
                      });
                  }
              }.bind(this));
    },

    onEdit: function () {
        this.setState(
            {onEdit: true});
    },

    exit: function () {
        this.setState(
            {onEdit: !this.state.onEdit}
        );
        $.get('../api/user.cgi',
              {
                  user: this.props.token,
                  type: 'status',
                  status: 'record',
                  log : true,
                  report: this.props.report
              },
              function(result) {
                  this.setState({
                      data: (result[0].report[this.props.report])
                  });
              }.bind(this));
    },

    toolBar: function () {
        if (!this.props.admin) { return (<div></div>);}
        if (this.state.onEdit) {
            return (
                    <ul className='status_toolbar'>
                    <li className='toolbutton'>編集中</li>
                    </ul>
            );
        } else {
            return (
                    <ul className='status_toolbar'>
                    <li className='toolbutton'><a href="javascript:void(0)" onClick={this.onEdit}>✏ 編集</a></li>
                    </ul>
            );
        }
    },

    render: function() {
        if (!this.state.init) {
            return (
                    <div className="status_view">
                    <img src="../image/loading.gif"/>
                    </div>
            );
        }
        if (!this.state.data) {
            return (
                    <div className="status_view">
                    なし
                    </div>
            );
        }
        var status = this.state.data;
        var logedit;
        if (this.state.onEdit) {
            logedit = (<LogEdit id={this.state.data.submit} rep={this.props.report} data={this.state.data.log} token={this.props.token} exit={this.exit}/>);
        } else {
            logedit = (<LogMessages log={this.state.data.log}/>);
        }
        return (
                <div>
                <div className="status_header">{this.toolBar()}</div>
                <div id={'status_view'} className='status_view'>
                <Log data={status} />
                {logedit}
                </div>
                </div>
        );
    }
});

module.exports = LogView;
