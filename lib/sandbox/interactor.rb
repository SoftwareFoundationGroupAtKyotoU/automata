# -*- coding: utf-8 -*-

require 'tmpdir'
require 'open3'
require_relative '../helper'
require_relative '../app/logger_ext'
require_relative '../zip/unzip'

module Sandbox
  # Usage: interactor file=<zip file> cmd=<command> input=<string>
  #   インタプリタを起動し標準入力から操作
  class Interactor
    def call(env)
      Dir.mktmpdir do |dir|
        helper = Helper.new(env);
        file = helper.params['file'][:tempfile]
        path = file.path
        file.close

        # extract archive file
        begin
          Zip::File.unzip(path, dir)
        rescue => e
          msg = "interactor.cgi failed to unzip \"#{path}\" with \"#{e}\""
          App::Logger.new.error(msg)
          raise RuntimeError, msg
        end

        # run
        cmd = helper.params['cmd']
        input = helper.params['input']

        result = Dir.chdir(dir) do
          output, err, res = Open3.capture3(cmd, :stdin_data => input);
          result = output + "\n" + err
          result = result + "\n Exit Code: " + res.to_s unless res.success?
          result
        end

        # result
        header = {
          'Content-Type' => 'text/plain',
          'charset'      => 'utf-8'
        }
        helper.ok(result, header)
      end
    end
  end
end
