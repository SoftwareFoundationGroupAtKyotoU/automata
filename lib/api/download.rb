# -*- coding: utf-8 -*-

require 'zip'

require_relative '../syspath'
require_relative '../app'
require_relative '../log'
require_relative '../helper'

module API
  # Usage: download report=<report-id> user=<login>
  #   提出ファイルのダウンロード
  class Download
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      token = helper.params['user'] || ''
      user = app.user_from_token(token)
      return helper.bad_request("Unknown user: #{token}") if user.nil? && app.su?
      return helper.forbidden if user.nil?

      report_id = helper.params['report']
      return helper.bad_request unless report_id

      time = Log.new(SysPath::user_log(report_id, user)).latest(:data)['id']
      return helper.bad_request unless time

      output = Zip::OutputStream.write_buffer do |zos|
        Dir.chdir(SysPath::user_src_dir(report_id, user, time)) {
          zip(Pathname.new('.'), zos, app)
        }
      end.string

      header = {
        'Content-Type' => 'application/zip',
        'Content-Length' => output.length
      }
      helper.ok(output, header)
    end

    private

    def zip(entry, zos, app)
      if entry.directory?
        entry.entries.select do |e|
          e.to_s != '.' && e.to_s != '..'
        end.each do |e|
          zip(entry+e, zos, app)
        end
      else
        zos.put_next_entry(entry.to_s)
        zos.write(entry.read)
      end
    end
  end
end
