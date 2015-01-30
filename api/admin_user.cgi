#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

# Usage: admin_user method=<method> <arguments>
#   ユーザ情報を編集
#   method:
#     delete: ユーザを削除
#       arguments:
#         user: ユーザトークン名
# Security:
#   master.su に入っているユーザのみ実行可能

require_relative '../lib/app'
require_relative '../lib/cgi_helper'

helper = CGIHelper.new
app = App.new(helper.cgi.remote_user)

helper.exit_with_forbidden unless app.su?

method = helper.param(:method) || ''
case method.intern
when :delete
  token = helper.param(:user) || ''
  remove_user = app.user_from_token(helper.param(:user))
  helper.exit_with_bad_request("Unknown user token: #{token}") unless remove_user
  app.delete_user(remove_user)
else
  helper.exit_with_bad_request("Unknown method: #{method}")
end

print(helper.cgi.header('status' => 'OK'))
puts('done')
