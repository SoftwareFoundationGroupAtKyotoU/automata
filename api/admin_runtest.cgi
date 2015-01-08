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

require 'shellwords'
require_relative '../lib/app'
require_relative '../lib/cgi_helper'

helper = CGIHelper.new
app = App.new(helper.cgi.remote_user)

# reject request by normal users
helper.exit_with_forbidden unless app.su?

# user must be specified
user = helper.param(:user)
helper.exit_with_bad_request unless user

# resolve real login name in case user id is a token
user = app.user_from_token(user)
helper.exit_with_bad_request unless user

# report ID must be specified
report_id = helper.param(:report)
helper.exit_with_bad_request unless report_id

cmd =
  [ App::FILES[:test_script],
    Shellwords.escape(report_id),
    Shellwords.escape(user),
  ].join(' ')
system(cmd)

print(helper.cgi.header('status' => 'OK'))
puts('done')
