#! /usr/bin/env ruby

# Usage: admin_log report=<report-id> user=<login>
#   ログを変更
# Options:
#   status            ステータスを変更
# Security:
#   master.su に入っているユーザのみ実行可能

$KCODE='UTF8'

$:.unshift('./lib')

STATUS = {
  400 => '400 Bad Request',
  403 => '403 Forbidden',
  500 => '500 Internal Server Error',
}

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

# resolve real login name in case user id is a token
user = app.user_from_token(user)
app.error_exit(STATUS[400]) unless user

# report ID must be specified
app.error_exit(STATUS[400]) if app.params['report'].empty?
report_id = app.params['report'][0]

begin
  log_file = (App::KADAI + report_id + user)[App::FILES[:log]]
  log = Log.new(log_file).latest(:data)
  time = log['id'] || log['timestamp']

  hash = {}
  hash['status'] = app.params['status'][0] unless app.params['status'].empty?

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
