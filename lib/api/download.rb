# -*- coding: utf-8 -*-

require 'zip'
require_relative '../app'

module API
  # Usage: download report=<report-id> user=<login>
  #   提出ファイルのダウンロード
  class Download
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      user = helper.params['user']
      return helper.bad_request unless user

      user = app.user_from_token(user)
      return helper.bad_request unless user

      report_id = helper.params['report']
      return helper.bad_request unless report_id

      user_dir = app.user_dir(report_id)
      time = Log.new(user_dir + App::FILES[:log]).latest(:data)['id']
      return helper.bad_request unless time

      output = Zip::OutputStream.write_buffer do |zos|
        Dir.chdir(user_dir + time + 'src') { zip(Pathname.new('.'), zos, app) }
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
