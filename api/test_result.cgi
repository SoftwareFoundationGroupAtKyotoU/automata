#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

# Usage: test_result report=<report-id> user=<login>
#   自動テストの結果を取得
# Options:
#   report            取得するファイルの属する課題ID
#   user              ログイン名が<login>のユーザの情報のみ取得
# Security:
#   master.su に入っていないユーザに関しては user オプションによらず
#   ログイン名が remote_user の情報のみ取得可能

require_relative '../lib/app'
require_relative '../lib/log'
require_relative '../lib/cgi_helper'

helper = CGIHelper.new
app = App.new(helper.cgi.remote_user)

def helper.error_exit(obj)
  print(helper.header)
  puts(helper.json(obj))
  exit
end

helper.error_exit({}) if helper.params['user'].empty?
user = helper.params['user'][0]

# resolve real login name in case user id is a token
user = app.users.inject(nil) do |r, u|
  (u.token == user || u.real_login == user) ? u.real_login : r
end
helper.error_exit({}) unless user

helper.error_exit({}) if helper.params['report'].empty?
report_id = helper.params['report'][0]

dir_user = App::KADAI + report_id + user
log_file = dir_user + App::FILES[:log]
helper.error_exit({}) unless [dir_user, log_file].all?(&:exist?)

log = Log.new(log_file, true).latest(:data)
result = {}

if log['log'] && log['log']['test']
  t = log['log']['test']
  result['passed'] = t['passed']
  result['number'] = t['number']
end

if log['test'] && (app.conf[:record, :detail] || app.su?)
  detail = log['test']

  if app.conf[:record, :detail] == 'brief' && !app.su?
    detail = detail.map{|x| { 'name' => x['name'], 'result' => x['result'] }}
  end

  result['detail'] = detail
end

print(helper.header)
puts(helper.json(result))
