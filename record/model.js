var Model = {};

Model.Config = function(json) {
    var conf = json.master || {};
    conf.comment = json.comment || {};
    if (conf.comment.enable) {
        conf.comment.enable = (conf.comment.enable != 'admin' || conf.admin);
    }
    conf.openAlways = (json.user.length == 1);
    return conf;
};

Model.Report = function(r) {
    r.hasTest = r.record.some(function(col){return col.field=='test';});
    return r;
};

Model.User = function(u) {
    u.getFields = function(rid, callback) {
        GNN.XHR.json.retrieve({ user: api('user', {
            report: rid, user: u.token,
            type: 'status', status: 'record', log: 1
        }) }, function(json) {
            var fields = GNN.inherit(fields, u);
            fields.record = (json.user[0].report||{})[rid]||{};
            callback(fields);
        }, jsonpFailure);
    };
    u.getCommentCount = function(rid, callback) {
        GNN.XHR.json.retrieve({ comment: api('comment', {
            report: rid, user: u.token, action: 'news'
        }) }, function(json) {
            callback(json.comment||{});
        });
    };
    return u;
};
