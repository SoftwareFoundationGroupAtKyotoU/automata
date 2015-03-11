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
#   - pathがバイナリファイルを指すとき: 
#     - 拡張子が.classならapplet表示用HTML(text/html)
#     - その他なら生ファイル(適切なMIMEタイプ)

require 'shellwords'
require 'time'
require 'shared-mime-info'
require_relative '../../lib/app'
require_relative '../../lib/log'
require_relative '../../lib/cgi_helper'

helper = CGIHelper.new
app = App.new(helper.cgi.remote_user)

helper.exit_with_bad_request if helper.params['user'].empty?
user = helper.params['user'][0]

# resolve real login name in case user id is a token
user = app.user_from_token(user)
helper.exit_with_forbidden unless user

helper.exit_with_bad_request if helper.params['report'].empty?
report_id = helper.params['report'][0]

path = CGI.unescape(helper.params['path'].first || '.')
dir_user = App::KADAI + report_id + user
log_file = dir_user + App::FILES[:log]
helper.exit_with_not_found unless [dir_user, log_file].all?(&:exist?)
time = Log.new(log_file, true).latest(:data)['id']

src = dir_user + time + 'src'
path = (src+path).expand_path
helper.exit_with_forbidden unless path.to_s.index(src.to_s)==0 # dir traversal
helper.exit_with_not_found unless [src, path].all?(&:exist?)

# follow symlink
src = src.realpath rescue nil
path = path.realpath rescue nil
helper.exit_with_forbidden unless src && path
helper.exit_with_forbidden unless path.to_s.index(src.to_s)==0 # dir traversal

applet_code = File.basename(path.to_s,".*")
relpath = path.parent.relative_path_from(src)
applet_codebase = "../browse/#{User.make_token(user)}/#{report_id}/#{relpath}"
jar_path = src.relative_path_from(path) + Pathname("../../jar/")
libs = app.conf[:master, :check, :default, :applet, :java_library]
applet_archive = libs.map{|item| jar_path + item}.join(",")
applet_width = app.conf[:master, :check, :default, :applet, :width]
applet_height = app.conf[:master, :check, :default, :applet, :height]

if path.directory?
  Dir.chdir(path.to_s) do
    files = path.entries.reject{|f| f.to_s =~ /^\.+$/}.sort do |a,b|
      "#{a.directory? ? 0 : 1}#{a.to_s}" <=> "#{b.directory? ? 0 : 1}#{b.to_s}"
    end.map do |f|
      { 'name' => f.to_s,
        'type' => f.directory? ? 'dir' : (MIME.check(f.to_s).media_type=='text' ? 'txt' : 'bin'),
        'size' => f.size,
        'time' => f.mtime.iso8601,
      }
    end
    print(helper.header)
    puts(helper.json(files))
  end
elsif MIME.check(path.to_s).media_type == 'text' && 'highlight' == helper.params['type'][0]
  dir = File.join(File.dirname(File.expand_path($0)), '../../script/vim')
  vimcmd =
    [ 'vim -e -s',
      "--cmd 'set runtimepath+=.'",
      "--cmd 'source vimrc'",
      "-S src2html.vim",
    ].join(' ');
  Dir.chdir(dir) do
    print(helper.cgi.header('type' => 'text/html', 'status' => 'OK'))
    print(`#{vimcmd} #{Shellwords.escape(path.to_s)}`)
  end
elsif '.class' == path.extname && 'highlight' == helper.params['type'][0] 
  # return html including applet tag when .class file is selected
  print(helper.cgi.header('type' => 'text/html', 'status' => 'OK'))
  applet_html = <<"APPLET"
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <body>
	<pre>
      <applet code="#{applet_code}"
			  codebase="#{applet_codebase}"
			  archive="#{applet_archive}"
			  width="#{applet_width}"
			  height="#{applet_height}"
			  >
        Note: This demo requires a Java enabled browser.  If you see this message then your browser either doesn't support Java or has had Java disabled.
	  </applet>
    </pre>
  </body>
</html>
APPLET
  print applet_html
else
  args = { 'type' => MIME.check(path.to_s).to_s, 'length' => path.size, 'status' => 'OK' }
  print(helper.cgi.header(args))
  File.open(path.to_s, 'rb') {|f| print(f.read) }
end
