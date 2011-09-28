var Admin = function(update) {
    var toFormData = function(hash) {
        var list = [];
        for (var k in hash) {
            list.push([k, hash[k]].map(encodeURIComponent).join('='));
        }
        return list.join(';');
    };
    var command = function(cmd, args, callback, error) {
        callback = callback || function(){};
        error = error || function(){};

        var req = new XMLHttpRequest();
        var uri = api('admin_'+cmd, {});
        var mime = 'application/x-www-form-urlencoded';
        req.open('POST', uri+'');
        req.setRequestHeader('Content-Type', mime);

        req.onreadystatechange = function(e) {
            if (req.readyState == 4) {
                if (200 <= req.status && req.status < 300) {
                    callback(req);
                } else {
                    error(req);
                }
            }
        }

        req.send(toFormData(args));
    };

    return {
        editStatus: function(args, callback, error) {
            command('log', args, callback, error);
        },
        editLog: function(args, callback, error) {
            command('log', args, callback, error);
        },
        runTest: function(user, report, callback, error) {
            var args = { user: user, report: report };
            command('runtest', args, callback, error);
        },
        update: update
    };
};
