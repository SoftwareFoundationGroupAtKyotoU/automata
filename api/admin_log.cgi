#! /usr/bin/env ruby

# Usage: admin_log report=<report-id> user=<login>
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

require 'shellwords'
require 'app'
require 'log'

app = App.new
def app.error_exit(status)
  print(cgi.header('type' => 'text/plain', 'status' => status))
  puts(status)
  exit
end

# reject request by normal users
app.error_exit(STATUS[403]) unless app.su?

# user must be specified
app.error_exit(STATUS[400]) if app.params['user'].empty?
user = app.params['user'][0]
user = user.read if user.respond_to?(:read)

# resolve real login name in case user id is a token
user = app.user_from_token(user)
app.error_exit(STATUS[400]) unless user

# report ID must be specified
app.error_exit(STATUS[400]) if app.params['report'].empty?
report_id = app.params['report'][0]
report_id = report_id.read if report_id.respond_to?(:read)

begin
  log_file = (App::KADAI + report_id + user)[App::FILES[:log]]
  log = Log.new(log_file).latest(:data)
  time = log['id'] || log['timestamp']

  hash = {}
  unless app.params['status'].empty?
    st = app.params['status'][0]
    st = st.read if st.respond_to?(:read)
    hash['status'] = st
  end

  log = {}
  LOGKEYS.each do |k|
    unless app.params[k].empty?
      val = app.params[k][0]
      val = val.read if val.respond_to?(:read)
      log[k] = val
    end
  end
  hash['log'] = log unless log.empty?

  unless hash.empty?
    Log.new(log_file, Time.parse(time)) do |log|
      log.update_data(hash)
    end
  end

  print(app.cgi.header)
  puts('done')
rescue => e
  app.error_exit(STATUS[500])
end
