#! /usr/bin/env ruby

# Usage: admin_log report=<report-id> user=<login> id=<log-id>
#   ログを変更
# Options:
#   status   ステータスを変更
#   message  メッセージを変更
#   error    エラーメッセージを変更
#   reason   エラーの詳細を変更
# Security:
#   master.su に入っているユーザのみ実行可能

$KCODE='UTF8'

$:.unshift('./lib')

STATUS = {
  400 => '400 Bad Request',
  403 => '403 Forbidden',
  500 => '500 Internal Server Error',
}

LOGKEYS = [ 'message', 'error', 'reason' ]

require 'app'
require 'log'

app = App.new

# reject request by normal users
app.error_exit(STATUS[403]) unless app.su?

# user must be specified
user = app.param(:user)
app.error_exit(STATUS[400]) unless user

# resolve real login name in case user id is a token
user = app.user_from_token(user)
app.error_exit(STATUS[400]) unless user

# report ID must be specified
report_id = app.param(:report)
app.error_exit(STATUS[400]) unless report_id

# log ID must be specified
log_id = app.param(:id)
app.error_exit(STATUS[400]) unless log_id

begin
  data = {}
  st = app.param(:status)
  data['status'] = st if st

  data_log = {}
  LOGKEYS.each do |k|
    val = app.param(k)
    data_log[k] = val if val
  end
  data['log'] = data_log

  unless data.empty?
    log_file = (App::KADAI + report_id + user)[App::FILES[:log]]
    Log.new(log_file).transaction do |log|
      app.error_exit(STATUS[400]) if log.latest(:data)['id'] != log_id
      log.update(:data, log_id, data)
    end
  end

  print(app.cgi.header)
  puts('done')
rescue => e
  app.error_exit(STATUS[500])
end
