var msgs = {
    done: "パスワードをメールで送信しました．",
    alreadyregistered: "入力されたメールアドレスは既に登録されています．",
    failed: "エラーが発生しました．管理者に連絡してください．"
}

function init() {
    var status = location.hash.substring(1)
    if(msgs[status]) {
        GNN.UI.$('msg').appendChild(GNN.UI.$text(msgs[status]))
    }
}
