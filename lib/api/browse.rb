# -*- coding: utf-8 -*-

require 'shellwords'
require 'time'
require 'shared-mime-info'

require_relative '../app'
require_relative '../log'
require_relative '../helper'

module API
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
  class Browse
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      return helper.bad_request unless helper.params['user']
      user = helper.params['user']

      # resolve real login name in case user id is a token
      user = app.user_from_token(user)
      return helper.forbidden unless user

      return helper.bad_request unless helper.params['report']
      report_id = helper.params['report']

      path = Rack::Utils.unescape(helper.params['path'] || '.')
      dir_user = App::KADAI + report_id + user
      log_file = dir_user + App::FILES[:log]
      return helper.not_found unless [dir_user, log_file].all?(&:exist?)
      time = Log.new(log_file, true).latest(:data)['id']

      src = dir_user + time + 'src'
      path = (src + path).expand_path
      return helper.forbidden unless path.to_s.index(src.to_s) == 0 # dir traversal
      return helper.not_found unless [src, path].all?(&:exist?)

      # follow symlink
      src = src.respond_to?(:realpath) ? src.realpath : nil
      path = path.respond_to?(:realpath) ? path.realpath : nil
      return helper.forbidden unless src && path
      return helper.forbidden unless path.to_s.index(src.to_s) == 0

      class_dir = path.parent
      realpath = class_dir.relative_path_from(src)
      applet_code = "code=\"#{File.basename(path.to_s, '.*')}\""
      applet_codebase =
        'codebase="../browse/' +
        [::User.make_token(user).to_s, report_id, realpath.to_s].join('/') + '"'
      jar_path = src.relative_path_from(class_dir) + Pathname('../../../jar/')
      libs = app.conf[:master, :check, :default, :applet, :java_library]
      w = app.conf[:master, :check, :default, :applet, :width] || 500
      h = app.conf[:master, :check, :default, :applet, :height] || 400
      if libs.nil? || libs.empty?
        applet_archive = ''
      else
        applet_archive =
          "archive=\"#{ (libs.map { |item| jar_path + item }).join(',') }\""
      end
      applet_width = "width=\"#{w}\""
      applet_height = "height=\"#{h}\""

      if path.directory?
        Dir.chdir(path.to_s) do
          files = path.entries.reject { |f| f.to_s =~ /^\.+$/ }.sort do |a, b|
            "#{a.directory? ? 0 : 1}#{a}" <=> "#{b.directory? ? 0 : 1}#{b}"
          end
          files.map! do |f|
            if f.directory?
              type = 'dir'
            else
              type = MIME.check(f.to_s).media_type == 'text' ? 'txt' : 'bin'
            end
            { 'name' => f.to_s,
              'type' => type,
              'size' => f.size,
              'time' => f.mtime.iso8601
            }
          end
          return helper.json_response(files)
        end
      elsif MIME.check(path.to_s).media_type == 'text' &&
            helper.params['type'] == 'highlight'
        dir = File.join(File.dirname(File.expand_path(__FILE__)),
                        '../../script/vim')
        vimcmd =
          [ 'vim -e -s',
            "--cmd 'set runtimepath+=.'",
            "--cmd 'source vimrc'",
            '-S src2html.vim'
          ].join(' ');
        Dir.chdir(dir) do
          return helper.ok(`#{vimcmd} #{Shellwords.escape(path.to_s)}`)
        end
      elsif '.class' == path.extname && 'highlight' == helper.params['type']
        # return html including applet tag when .class file is selected

        applet_html = <<"APPLET"
      <?xml version="1.0" encoding="utf-8"?>
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <body>
          <pre>
            <applet #{applet_code}
              #{applet_codebase}
              #{applet_archive}
              #{applet_width}
              #{applet_height}
              >
            Note: This demo requires a Java enabled browser.  If you see this message then your browser either doesn't support Java or has had Java disabled.
            </applet>
          </pre>
        </body>
      </html>
APPLET

        helper.ok(applet_html)
      else
        header = {
          'Content-Type' => MIME.check(path.to_s).to_s,
          'Content-Length' => path.size
        }
        content = nil
        File.open(path.to_s, 'rb') { |f| content = f.read }
        Rack::Response.new([content], 200, header)
      end
    end
  end
end
