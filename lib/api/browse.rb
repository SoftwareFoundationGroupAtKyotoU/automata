# -*- coding: utf-8 -*-

require 'shellwords'
require 'time'
require 'shared-mime-info'
require 'mime-types'
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
  #       body: [ { name: ファイル名, type: dir|txt|bin|html,
  #                 size: byte, time: yyyy-dd-mmThh:MM:ss+ZONE } ] }
  #   - type=rawまたは指定がないとき: ファイルそのもの
  #   - type=highlightのとき: JSON
  #     - pathがHTMLを生成するファイルを指すとき:
  #       { type: 'html', body: HTMLファイル }
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
          elsif find_browse_conf(app, f)
            type = 'html'
          else
            type = mime(f).media_type == 'text' ? 'txt' : 'bin'
          end
          {
            'name' => f.basename.to_s,
            'type' => type,
            'size' => f.size,
            'time' => f.mtime.iso8601
          }
        end
        return helper.json_response({'type' => 'dir', 'body' => files})
      elsif 'highlight' == helper.params['type']
        name, conf = find_browse_conf(app, path)
        if name
          require_relative "../browse/#{name}"
          clazz =
            ::Browse.const_get(name.slice(0,1).capitalize + name.slice(1..-1))
          html = clazz.new.html(
            Pathname('..'),
            path.relative_path_from(src),
            user,
            report_id,
            conf
          )
          helper.json_response({'type' => 'html', 'body' => html})
        elsif mime(path).media_type == 'text'
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
        else
          helper.json_response({'type' => 'bin'})
        end
      else
        header = {
          'Content-Type' => mime(path).to_s,
          'Content-Length' => path.size
        }
        content = nil
        File.open(path.to_s, 'rb') { |f| content = f.read }
        Rack::Response.new([content], 200, header)
      end
    end

    def mime(path)
      MIME::Types.type_for(path.to_s)[0] || MIME.check(path.to_s)
    end

    def find_browse_conf(app, path)
      path = path.to_s
      (app.conf[:master, :browse] || {}).find{|k,v| path.to_s =~ /#{v['file']}/}
    end
  end
end
