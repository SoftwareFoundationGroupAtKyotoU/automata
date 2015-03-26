var $ = require('jquery');

var msgs = {
    done: 'パスワードをメールで送信しました．',
    notfound: '入力されたメールアドレスは登録されていませんでした．'
};

function init() {
    var status = location.hash.substring(1);
    if(typeof msgs[status] !== 'undefined') {
        $('#msg').text(msgs[status]);
    }
}

window.addEventListener('DOMContentLoaded', init, false);
