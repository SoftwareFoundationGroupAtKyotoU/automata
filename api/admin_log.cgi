#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

# Usage: admin_log report=<report-id> user=<login> id=<log-id>
#   ログを変更
# Options:
#   status   ステータスを変更
#   message  メッセージを変更
#   error    エラーメッセージを変更
#   reason   エラーの詳細を変更
# Security:
#   master.su に入っているユーザのみ実行可能

$KCODE='UTF8' if RUBY_VERSION < '1.9.0'

$:.unshift('./lib')

LOGKEYS = [ 'message', 'error', 'reason' ]

require 'app'
require 'log'
require 'cgi_helper'

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

# log ID must be specified
log_id = helper.param(:id)
helper.exit_with_bad_request unless log_id

begin
  data = {}
  st = helper.param(:status)
  data['status'] = st if st

  data_log = {}
  LOGKEYS.each do |k|
    val = helper.param(k)
    data_log[k] = val if val
  end
  data['log'] = data_log

  unless data.empty?
    log_file = (App::KADAI + report_id + user)[App::FILES[:log]]
    Log.new(log_file).transaction do |log|
      helper.exit_with_bad_request if log.latest(:data)['id'] != log_id
      log.update(:data, log_id, data)
    end
  end

  print(helper.cgi.header('status' => 'OK'))
  puts('done')
rescue => e
  helper.exit_with_internal_server_error
end
