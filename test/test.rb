#! /usr/bin/env ruby

Dir.chdir(File.dirname(File.expand_path($0)))
$:.unshift('./lib')

require 'fileutils'
require 'yaml'
require 'time'

require 'app'
require 'conf'
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
  :master => App::FILES[:master],
  :local  => App::FILES[:local],
}

yml = {}
files.each do |name, file|
  yml[name] = YAML.load_file(file)||{} rescue {}
end

master = App::Conf.new(yml[:master])
local = App::Conf.new(yml[:local])

conf = {}
[ :test ].each do |k|
  conf[k] = {}
  [ :default, report_id ].each do |l|
    ks = [ :check, l, k ]
    conf[k].merge!((master[*ks]||{}).to_hash.merge((local[*ks]||{}).to_hash))
  end
end

info = nil

begin
  unless File.exist?(dir[:test].to_s)
    raise RuntimeError, "'#{dir[:test]}' not found"
  end

  run = conf[:test]['run']
  exit unless run

  fs = conf[:test]['files']
  output = conf[:test]['output']
  output = output.is_a?(Symbol) ? ':'+output.to_s : output

  cmd =
    [ 'curl',
      "-F 'file=@#{ZIP}'",
      "-F 'cmd=#{run}'",
      output && "-F 'output=#{output}'",
      conf[:test]['sandbox'],
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
  begin
    result = YAML.load(result)
    passed = result.count{|r| /^\s*ok\s*$/i =~ (r['result']||'')}
    log = { 'test' => { 'passed' => passed, 'number' => result.size } }
  rescue => e
    log = { 'error' => err[:fail], 'reason' => e.to_s }
  end

  info = {
    'status'    => 'OK',
    'timestamp' => Time.now.iso8601,
    'log'       => log,
    'test'      => result
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
