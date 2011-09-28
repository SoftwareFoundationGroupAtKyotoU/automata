var Admin = function(update) {
    var command = function(cmd, args, callback, error) {
        callback = callback || function(){};
        error = error || function(){};

        var req = new XMLHttpRequest();
        var uri = api('admin_'+cmd, args);
        uri.params['timestamp'] = encodeURI(new Date());
        req.open('GET', uri+'');

        req.onreadystatechange = function(e) {
            if (req.readyState == 4) {
                if (200 <= req.status && req.status < 300) {
                    callback(req);
                } else {
                    error(req);
                }
            }
        }

        req.send(null);
    };

    return {
        changeStatus: function(user, report, status, callback, error) {
            var args = { user: user, report: report, status: status };
            command('log', args, callback, error);
        },
        runTest: function(user, report, callback, error) {
            var args = { user: user, report: report };
            command('runtest', args, callback, error);
        },
        update: update
    };
};
