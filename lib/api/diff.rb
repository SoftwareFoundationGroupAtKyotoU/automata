# -*- coding: utf-8 -*-

require 'time'
require 'open3'

require_relative '../syspath'
require_relative '../conf'
require_relative '../app'
require_relative '../user'
require_relative '../log'
require_relative '../helper'

module API
  # Usage: diff report=<report-id> user=<login>
  #             [time=<timestamp>]
  #   time(=提出物ID)で指定された提出物と最新の提出物のdiffを取って出力．
  #   timeがなければ，提出物IDのリストを返す．
  # Options:
  #   report            比較対象の提出物の属するレポートID
  #   user              ログイン名が<login>のユーザの情報のみ取得
  #   time              比較する提出物ID (yyyy-dd-mmThh:MM:ss+ZONE)
  # Security:
  #   master.su に入っていないユーザに関しては user オプションによらず
  #   ログイン名が remote_user の情報のみ取得可能
  # Return value:
  #   - timeがないとき: JSON
  #     { list: 提出物ID一覧 [yyyy-dd-mmThh:MM:ss+ZONE,...] }
  #   - timeがあるとき: HTML
  #     diffの出力結果
  class Diff
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      return helper.bad_request unless helper.params['user']
      user = helper.params['user']

      # resolve real login name in case user id is a token
      user = app.user_from_token_or_login(user)
      return helper.forbidden unless user

      return helper.bad_request unless helper.params['report']
      report_id = helper.params['report']

      log_file = SysPath.user_log(report_id, user)
      return helper.json_response({'list' => []}) unless log_file.exist?
      log = Log.new(log_file, true)

      # return submit id list if 'time' param is not given
      submit_id_list = log.idlist(:data)
      return helper.json_response({'list' => submit_id_list}) unless helper.params['time']

      # get src-dir of given submit_id
      given_submit_id = helper.params['time']
      gt_src = SysPath.user_src_dir(report_id, user, given_submit_id)
      return helper.not_found unless gt_src.exist?

      # get src-dir of latest submit_id
      latest_submit_id = log.latest(:data)['id']
      ot_src = SysPath.user_src_dir(report_id, user, latest_submit_id)
      return helper.not_found unless ot_src.exist?

      # get the result of diff and return it
      result_html = diff2html(diff(user, report_id, given_submit_id, latest_submit_id))
      return helper.ok(result_html)
    end
    
    # Run diff command and return the result.
    # @param [String] user login name
    # @param [String] report_id report id
    # @param [String] older_submit_id of the form (yyyy-dd-mmThh:MM:ss+ZONE)
    # @param [String] newer_submit_id of the form (yyyy-dd-mmThh:MM:ss+ZONE)
    def diff(user, report_id, older_submit_id, newer_submit_id)
      dir = SysPath.user_dir(report_id, user).realpath
      result = Open3.popen3("diff -ur #{Shellwords.escape(older_submit_id.to_s)} #{Shellwords.escape(newer_submit_id.to_s)}", {chdir: dir.to_s}) do |i, o, e, t|
        i.close
        o.read.force_encoding('utf-8')
      end
      return result
    end

    # Return html from the result of diff command.
    # @param [String] diff the result of diff command.
    def diff2html(diff)
      data = "<body>" + diff + "</body>"

      data.gsub!(/^\+(.*)$/){"<font color='#66cc99'>+#{CGI::escapeHTML($1)}</font>"}
      data.gsub!(/^-(.*)$/){"<font color='#ff9966'>-#{CGI::escapeHTML($1)}</font>"}
      data.gsub!(/^Only (.*)$/){"<font color='#9999ff'><b>Only #{CGI::escapeHTML($1)}</b></font>"}
      data.gsub!(/^diff (.*)$/){"<font ><b>diff #{CGI::escapeHTML($1)}</b></font>"}
      data.gsub!(/\r\n|\n|\r/,"<br />")

      return data
    end
  end
end
