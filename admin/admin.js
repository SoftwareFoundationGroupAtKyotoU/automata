$(function() {
    function load_users() {
        $.get("../api/user.cgi?email=true", function(data) {
            for (var i = 0; i < data.length; ++i) {
                var user = data[i];
                var button = $("<button>del</button>");
                button.click((function(user) {
                    return function() {
                        if (confirm("really delete the following user?\n" + user["name"])) {
                            del_user(user);
                        }
                    }})(user));
                var td = $("<td>").append(button);
                var tr = $("<tr>", {class: user["token"]})
                    .append(td)
                    .append("<td>" + user["login"] + "</td>"
                            + "<td>" + user["name"] + "</td>"
                            + "<td>" + user["ruby"] + "</td>"
                            + "<td>" + user["email"] + "</td>");
                $("#deluser").append(tr);
            }
        });
    }

    function del_user(user) {
        $.blockUI({
            message: "<div><img src='ajax-loader.gif'> deleting user: " + user["name"] + "</div>",
            css: {padding: '20px'},
        });
        $.ajax({
            url: "../api/admin_user.cgi",
            data: {method: "delete", user: user["token"]},
            dataType: "text",
            type: "POST",
            success: function(data) {
                $("#deluser ."+user["token"]).remove();
            },
            error: function(xhr, status, error) {
                alert(status+" : "+error+"\n"+xhr.responseText);
            },
            complete: function() {
                $.unblockUI();
            },
        });
    }

    load_users();
});
