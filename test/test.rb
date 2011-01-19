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

err = {
  :fatal => '自動テストを実行できませんでした; TAに問い合わせて下さい',
  :fail  => '自動テストがうまく実行されませんでした; 実装を確認して下さい',
}
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

    result = nil
    result = `#{cmd}` if check
    result = nil unless $? == 0

    result
  end

  raise RuntimeError, cmd unless result
  summary = result.to_a.reject{|l| l =~ /^(?:Case|\s+)/}.join

  log = (summary.strip.empty? ?
         { 'error' => err[:fail] } : { 'test case' => summary })
  info = {
    'status'    => 'OK',
    'timestamp' => Time.now.iso8601,
    'log'       => log,
    'detail'    => result,
  }

rescue => e
  info = {
    'status'    => 'check:NG',
    'timestamp' => Time.now.iso8601,
    'log'       => {
      'message' => err[:fatal],
      'reason'  => e.to_s,
    },
  }
end

Log.new(files[:log], Time.parse(post_tz)).write_data(info)
