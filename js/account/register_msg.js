var msgs = {
    done: "パスワードをメールで送信しました．",
    alreadyregistered: "入力された学籍番号またはメールアドレスは既に登録されています．",
    invalidarguments: "入力された値のどれかが空か，学籍番号が10桁の半"
        + "角数字ではありません．",
    failed: "エラーが発生しました．管理者に連絡してください．"
}

function init() {
    var status = location.hash.substring(1)
    if(msgs[status]) {
        GNN.UI.$('msg').appendChild(GNN.UI.$text(msgs[status]))
    }
}
