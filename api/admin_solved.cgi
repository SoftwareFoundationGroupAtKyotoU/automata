#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

# Usage: admin_solved report=<report-id> user=<login> exercise=ex1,ex2,..,exN
#   問いた問題を変更
# Security:
#   master.su に入っているユーザのみ実行可能

$KCODE='UTF8' if RUBY_VERSION < '1.9.0'

$:.unshift('./lib')

STATUS = {
  400 => '400 Bad Request',
  403 => '403 Forbidden',
  500 => '500 Internal Server Error',
}

require 'app'
require 'log'
require 'report/exercise'
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

# exercises must be specified
exercises = helper.param(:exercise)
helper.error_exit(STATUS[400]) unless exercises
exercises = exercises.split(',').sort{|a,b| a.to_ex <=> b.to_ex}

begin
  log_file = (App::KADAI + report_id + user)[App::FILES[:log]]
  Log.new(log_file).transaction do |log|
    log.latest(:data)['report'] = exercises
  end

  print(helper.cgi.header('status' => 'OK'))
  puts('done')
rescue => e
  helper.error_exit(STATUS[500])
end
