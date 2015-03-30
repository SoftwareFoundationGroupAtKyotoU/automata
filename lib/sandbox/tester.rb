# -*- coding: utf-8 -*-

require 'tmpdir'
require 'fileutils'
require_relative '../helper'
require_relative '../file/random_basename'

module Sandbox
  class Tester
    def call(env)
      Dir.mktmpdir do |dir|
        helper = Helper.new(env);
        file = helper.params['file'][:tempfile]
        path = file.path
        file.close

        # extract archive file
        res = system("env 7z x -o#{dir} #{path} > /dev/null 2>&1")
        raise RuntimeError, :unzip unless res

        # command line argument
        args = []

        # output file (if any)
        output = helper.params['output']
        if output == ':argument'
          # supply random file name to the command line argument
          output = File.random_basename
          args << output
        end

        # run
        cmd = helper.params['cmd']
        result = Dir.chdir(dir) do
          FileUtils.chmod(0755, cmd)
          run = ([ File.join(dir, cmd) ] + args).join(' ')
          if output
            system("#{run} > /dev/null 2>&1")
            File.exist?(output) ? IO.read(output) : ''
          else
            `#{run}`
          end
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
