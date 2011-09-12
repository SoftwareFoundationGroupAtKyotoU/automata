#! /usr/bin/env ruby

# Usage: browse report=<report-id> [user=<login>]
#               [type={raw|highlight}] [path=.]
#   アップロードされたファイルを取得
# Options:
#   report            取得するファイルの属する課題ID
#   user              ログイン名が<login>のユーザの情報のみ取得
#   type   raw        生ファイル取得
#          highlight  (可能なら)ハイライトしたHTMLを取得
#   path              取得するファイルのパス
# Security:
#   master.su に入っていないユーザに関しては user オプションによらず
#   ログイン名が remote_user の情報のみ取得可能
# Return value:
#   - pathがディレクトリのとき: JSON
#     [ { name: ファイル名, type: dir|txt|bin,
#         size: byte, time: yyyy-dd-mmThh:MM:ss+ZONE } ]
#   - pathがテキストファイルを指すとき:
#     - type=rawならそのファイルそのもの(text/**)
#     - type=highlightならハイライトしたHTML(text/html)
#   - pathがバイナリファイルを指すとき: 生ファイル(適切なMIMEタイプ)

$KCODE='UTF8'

$:.unshift('./lib')

STATUS = {
  400 => '400 Bad Request',
  403 => '403 Forbidden',
  404 => '404 Not Found',
}

require 'time'
require 'app'
require 'log'
require 'mime'
app = App.new

def app.error_exit(status)
  print(cgi.header('type' => 'text/plain', 'status' => status))
  puts(status)
  exit
end

app.error_exit(STATUS[400]) if app.params['user'].empty?
user = app.params['user'][0]

# resolve real login name in case user id is a token
user = app.users.inject(nil) do |r, u|
  u.login == user ? u.real_login : r
end
app.error_exit(STATUS[404]) unless user

app.error_exit(STATUS[400]) if app.params['report'].empty?
report_id = app.params['report'][0]

app.error_exit(STATUS[403]) unless app.su? || user == app.user # permission

path = app.params['path'][0] || '.'
dir_user = App::KADAI + report_id + user
log_file = dir_user + App::FILES[:log]
app.error_exit(STATUS[404]) unless [dir_user, log_file].all?(&:exist?)

log = Log.new(log_file).latest(:data)
time = log['id'] || log['timestamp']

src = dir_user + time + 'src'
path = (src+path).expand_path
app.error_exit(STATUS[404]) unless [src, path].all?(&:exist?)
app.error_exit(STATUS[403]) unless path.to_s.index(src.to_s)==0 # dir traversal

if path.directory?
  Dir.chdir(path.to_s) do
    files = path.entries.reject{|f| f.to_s =~ /^\.+$/}.sort do |a,b|
      "#{a.directory? ? 0 : 1}#{a.to_s}" <=> "#{b.directory? ? 0 : 1}#{b.to_s}"
    end.map do |f|
      { 'name' => f.to_s,
        'type' => f.directory? ? 'dir' : (f.mime.type=='text' ? 'txt' : 'bin'),
        'size' => f.size,
        'time' => f.mtime.iso8601,
      }
    end
    print(app.header)
    puts(app.json(files))
  end
elsif path.mime.type == 'text' && 'highlight' == app.params['type'][0]
  # TODO
  print(app.cgi.header('status' => '503 Service Unavailable'))
  puts('503 Service Unavailable')
else
  print(app.cgi.header('type' => path.mime.to_s, 'length' => path.size))
  print(IO.read(path.to_s))
end
