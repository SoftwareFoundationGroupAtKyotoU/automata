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

  run = yml[:test]['run']
  fs = yml[:test]['files']
  output = yml[:test]['output']
  output = output.is_a?(Symbol) ? ':'+output.to_s : output

  cmd =
    [ 'curl',
      "-F 'file=@#{ZIP}'",
      "-F 'cmd=#{run}'",
      output && "-F 'output=#{output}'",
      yml[:test]['sandbox'],
    ].compact.join(' ')

  result = Dir.chdir(dir[:test].to_s) do
    check =
      [ proc{ File.exist?(ZIP) && FileUtils.rm(ZIP); true },
        proc{ fs.all?{|x| File.exist?(x)} },
        ([ "zip #{ZIP}" ] + fs.map{|x|'"'+x+'"'}).join(' '),
      ].all?(&proc{|x| (x.is_a?(String)&&system(x))||(x.is_a?(Proc)&&x.call)})

    result = nil
    result = `#{cmd}` if check
    result = nil unless $? == 0

    result
  end

  raise RuntimeError, cmd unless result
  ra = result.to_a
  summary = ra.last(ra.reverse.find_index{|x| /^\s+/ =~ x} || ra.length).join

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
