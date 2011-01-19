#! /usr/bin/env ruby

Dir.chdir(File.dirname(File.expand_path($0)))
$:.unshift('./lib')

require 'fileutils'
require 'yaml'
require 'time'

require 'app'
require 'log'

report_id = $*.shift
user      = $*.shift
post_tz   = $*.shift

ERROR = '自動テストを実行できませんでした; TAに問い合わせて下さい'
ZIP = 'test.zip'

dir = {}
dir[:user]   = App::KADAI + report_id + user
dir[:test]   = dir[:user] + 'test'

files = {
  :log    => dir[:user][App::FILES[:log]],
  :config => App::FILES[:master],
}

yml = {}
files.each do |name, file|
  yml[name] = YAML.load_file(file)||{} rescue {}
end
yml[:test] = yml[:config]['test']

info = nil

begin
  unless File.exist?(dir[:test].to_s)
    raise RuntimeError, "'#{dir[:test]}' not found"
  end

  cmd =
    [ 'curl',
      "-F 'file=@#{ZIP}'",
      "-F 'cmd=#{App::FILES[:test]}'",
      yml[:test]['sandbox'],
    ].join(' ')

  result = Dir.chdir(dir[:test].to_s) do
    check =
      [ proc{ File.exist?(ZIP) && FileUtils.rm(ZIP); true },
        proc{ File.exist?(App::FILES[:test]) && File.exist?(App::FILES[:in]) },
        "zip #{ZIP} #{App::FILES[:test]} #{App::FILES[:in]}",
      ].all?(&proc{|x| (x.is_a?(String)&&system(x))||(x.is_a?(Proc)&&x.call)})

    check ? `#{cmd}` : nil
  end

  result = result.to_a.reject{|l| l =~ /^(?:Case|\s+)/}.join
  raise RuntimeError, cmd if result.strip.empty?

  info = {
    'status'    => 'OK',
    'timestamp' => Time.now.iso8601,
    'log'       => { 'test case' => result }
  }

rescue => e
  info = {
    'status'    => 'check:NG',
    'timestamp' => Time.now.iso8601,
    'log'       => {
      'message' => ERROR,
      'reason'  => e.to_s,
    },
  }
end

Log.new(files[:log], Time.parse(post_tz)).write_data(info)
