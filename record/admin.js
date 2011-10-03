var Admin = function(update) {
    var command = function(cmd, args, callback, error) {
        apiPost('admin_'+cmd, args, callback, error);
    };

    return {
        editStatus: function(args, callback, error) {
            command('log', args, callback, error);
        },
        editLog: function(args, callback, error) {
            command('log', args, callback, error);
        },
        editSolved: function(args, callback, error) {
            command('solved', args, callback, error);
        },
        runTest: function(user, report, callback, error) {
            var args = { user: user, report: report };
            command('runtest', args, callback, error);
        },
        update: update
    };
};
