# -*- coding: utf-8 -*-

require 'shellwords'
require 'time'
require 'shared-mime-info'
require 'open3'

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
  #     { type: 'dir',
  #       body: [ { name: ファイル名, type: dir|txt|bin,
  #                 size: byte, time: yyyy-dd-mmThh:MM:ss+ZONE } ] }
  #   - type=rawまたは指定がないとき: ファイルそのもの
  #   - type=highlightのとき: JSON
  #     - pathがテキストファイルを指すとき:
  #       { type: 'txt', body: テキストをハイライトしたHTML }
  #     - pathがバイナリファイルを指すとき:
  #       { type: 'bin' }
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

      path = helper.params['path'] || '.'
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

      if path.directory?
        files = path.children.sort do |a, b|
          "#{a.directory? ? 0 : 1}#{a}" <=> "#{b.directory? ? 0 : 1}#{b}"
        end
        files.map! do |f|
          if f.directory?
            type = 'dir'
          else
            type = MIME.check(f.to_s).media_type == 'text' ? 'txt' : 'bin'
          end
          {
            'name' => f.basename.to_s,
            'type' => type,
            'size' => f.size,
            'time' => f.mtime.iso8601
          }
        end
        return helper.json_response({'type' => 'dir', 'body' => files})
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
        result = Open3.popen3("#{vimcmd} #{Shellwords.escape(path.realpath.to_s)}",
                              { chdir: dir.to_s }) do |i, o, e, t|
          i.close
          o.read.force_encoding('utf-8')
        end
        return helper.json_response({'type' => 'txt', 'body' => result})
      elsif '.class' == path.extname && 'highlight' == helper.params['type']
        # return html including applet tag when .class file is selected
        applet_html = self.gen_applet_html(
          Pathname('..'),
          path.relative_path_from(src),
          user,
          report_id,
          app.conf[:master, :browse, :applet]
        )
        helper.json_response({'type' => 'txt', 'body' => applet_html})
      elsif  helper.params['type'] == 'highlight'
        helper.json_response({'type' => 'bin'})
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

    def gen_applet_html(root, path, user, report_id, conf)
      # applet tag consists of five attributes, 'code', 'codebase', 'archive', 'height' and 'width'
      # 'code' is a name of main class
      # 'codebase' is relative_path from "/public/record/" to a path where .class files exist
      # 'archive' is relative path from 'codebase' to "/public/jar/"
      
      # the path to the directory including .class file
      codebase_from_root =
        [
         root,
         'browse',
         ::User.make_token(user).to_s,
         report_id,
         path.parent
        ].reduce {|dir,sub| dir+sub}

      archive_path = root + 'jar'
      libs = conf['java_library']
      if libs.nil? || libs.empty?
        libs = []
      else
        rel_archive_path = archive_path.relative_path_from(codebase_from_root)
        libs = (libs.map { |item| rel_archive_path + item })
      end

      # width and height of applet view
      width = conf['width'] || 500
      height = conf['height'] || 400
      
      applet_html = <<"APPLET"
      <?xml version="1.0" encoding="utf-8"?>
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <body>
          <pre>
            <applet
              code="#{File.basename(path.to_s, '.*')}"
              codebase="#{codebase_from_root}
              #{libs.empty? ? '' : '"archive=' + libs.join(',') + '"'}
              width="#{width}"
              height="#{height}"
              >
            Note: This demo requires a Java enabled browser.  If you see this message then your browser either doesn't support Java or has had Java disabled.
            </applet>
          </pre>
        </body>
      </html>
APPLET
      return applet_html
    end
  end
end
