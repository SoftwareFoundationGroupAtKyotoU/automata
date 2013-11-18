#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

# Usage: admin_runtest report=<report-id> user=<login>
#   自動テストを再実行
# Options:
#   report            課題ID
#   user              ログイン名が<login>のユーザの情報のみ取得
# Security:
#   master.su に入っているユーザのみ実行可能

$KCODE='UTF8' if RUBY_VERSION < '1.9.0'

$:.unshift('./lib')

STATUS = {
  400 => '400 Bad Request',
  403 => '403 Forbidden',
  500 => '500 Internal Server Error',
}

require 'shellwords'
require 'app'
require 'cgi_helper'

helper = CGIHelper.new
app = App.new(helper.cgi.remote_user)

# reject request by normal users
helper.error_exit(STATUS[403]) unless app.su?

# user must be specified
user = helper.param(:user)
helper.error_exit(STATUS[400]) unless user

# resolve real login name in case user id is a token
user = app.user_from_token(user)
helper.error_exit(STATUS[400]) unless user

# report ID must be specified
report_id = helper.param(:report)
helper.error_exit(STATUS[400]) unless report_id

cmd =
  [ App::FILES[:test_script],
    Shellwords.escape(report_id),
    Shellwords.escape(user),
  ].join(' ')
system(cmd)

print(helper.cgi.header('status' => 'OK'))
puts('done')
