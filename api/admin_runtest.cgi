#! /usr/bin/env ruby

# Usage: admin_runtest report=<report-id> user=<login>
#   自動テストを再実行
# Options:
#   report            課題ID
#   user              ログイン名が<login>のユーザの情報のみ取得
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

cmd =
  [ App::FILES[:test_script],
    Shellwords.escape(report_id),
    Shellwords.escape(user),
  ].join(' ')
system(cmd)

print(app.cgi.header)
puts('done')
