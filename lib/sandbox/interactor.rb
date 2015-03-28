# -*- coding: utf-8 -*-

require 'tmpdir'
require 'open3'
require_relative '../helper'

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
        res = system("env 7z x -o#{dir} #{path} > /dev/null 2>&1")
        raise RuntimeError, :unzip unless res

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
