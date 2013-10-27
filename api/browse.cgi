#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

# Usage: browse report=<report-id> user=<login>
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

$KCODE='UTF8' if RUBY_VERSION < '1.9.0'

$:.unshift('./lib')

STATUS = {
  400 => '400 Bad Request',
  403 => '403 Forbidden',
  404 => '404 Not Found',
}

require 'shellwords'
require 'time'
require 'app'
require 'log'
require 'mime'

app = App.new

app.error_exit(STATUS[400]) if app.params['user'].empty?
user = app.params['user'][0]

# resolve real login name in case user id is a token
user = app.user_from_token(user)
app.error_exit(STATUS[403]) unless user

app.error_exit(STATUS[400]) if app.params['report'].empty?
report_id = app.params['report'][0]

path = CGI.unescape(app.params['path'].first || '.')
dir_user = App::KADAI + report_id + user
log_file = dir_user + App::FILES[:log]
app.error_exit(STATUS[404]) unless [dir_user, log_file].all?(&:exist?)
time = Log.new(log_file, true).latest(:data)['id']

src = dir_user + time + 'src'
path = (src+path).expand_path
app.error_exit(STATUS[403]) unless path.to_s.index(src.to_s)==0 # dir traversal
app.error_exit(STATUS[404]) unless [src, path].all?(&:exist?)

# follow symlink
src = src.realpath rescue nil
path = path.realpath rescue nil
app.error_exit(STATUS[403]) unless src && path
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
  dir = File.join(File.dirname(File.expand_path($0)), 'vim')
  vimcmd =
    [ 'vim -e -s',
      "--cmd 'set runtimepath+=.'",
      "--cmd 'source vimrc'",
      "-S src2html.vim",
    ].join(' ');
  Dir.chdir(dir) do
    print(app.cgi.header('type' => 'text/html', 'status' => 'OK'))
    print(`#{vimcmd} #{Shellwords.escape(path.to_s)}`)
  end
else
  args = { 'type' => path.mime.to_s, 'length' => path.size, 'status' => 'OK' }
  print(app.cgi.header(args))
  open_mode = RUBY_VERSION < '1.9.0' ? 'r' : 'r:utf-8'
  file = File.open(path.to_s, open_mode)
  print(file.read())
end
