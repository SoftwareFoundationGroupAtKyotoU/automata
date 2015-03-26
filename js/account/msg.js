var UI = require('../gnn/ui');

var msgs = {
    done: "パスワードをメールで送信しました．",
    notfound: "入力されたメールアドレスは登録されていませんでした．"
};

function init() {
    var status = location.hash.substring(1);
    if(msgs[status]) {
        UI.$('msg').appendChild(UI.$text(msgs[status]));
    }
}

window.addEventListener('DOMContentLoaded', init, false);
