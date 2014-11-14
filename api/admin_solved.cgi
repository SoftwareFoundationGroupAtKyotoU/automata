#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

# Usage: admin_solved report=<report-id> user=<login> exercise=ex1,ex2,..,exN
#   問いた問題を変更
# Security:
#   master.su に入っているユーザのみ実行可能

$KCODE='UTF8' if RUBY_VERSION < '1.9.0'

$:.unshift('./lib')

require 'app'
require 'log'
require 'report/exercise'
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

# exercises must be specified
exercises = helper.param(:exercise)
helper.exit_with_bad_request unless exercises
exercises = exercises.split(',').sort{|a,b| a.to_ex <=> b.to_ex}

begin
  log_file = App::KADAI + report_id + user + App::FILES[:log]
  Log.new(log_file).transaction do |log|
    log.latest(:data)['report'] = exercises
  end

  print(helper.cgi.header('status' => 'OK'))
  puts('done')
rescue => e
  helper.exit_with_internal_server_error
end
