#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

Dir.chdir(File.dirname(File.expand_path($0)))

require 'fileutils'
require 'yaml'
require 'time'

require_relative '../lib/app'
require_relative '../lib/dir/each_leaf'
require_relative '../lib/conf'
require_relative '../lib/log'
require_relative '../lib/report/exercise'

report_id = $*.shift
user      = $*.shift
post_tz   = $*.shift
exes = $*
exes = ARGF.file.readlines.map(&:strip).reject(&:empty?) if exes.empty?

dir = {}
dir[:user]   = App::KADAI + report_id + user
dir[:test]   = dir[:user] + 'test'
dir[:src]    = dir[:user] + post_tz + 'src'
dir[:target] = dir[:test] + 'src'
dir[:build]  = App::BUILD

files = {
  log: dir[:user] + App::FILES[:log]
}

yml = {}
files.each{|name, file| yml[name] = YAML.load_file(file)||{} rescue {} }

app = App.new
conf = {}
[:build, :test].each do |k|
  conf[k] = {}
  [:default, report_id].each do |l|
    conf[k].merge!((app.conf[:master, :check, l, k] || {}).to_hash)
  end
end

build_commands = conf[:build]['command']
status_code = {
  failure:  'NG',
  complete: 'OK'
}

file_loc = nil
(conf[:build]['file_location'] || []).each do |loc|
  ex = loc['exercise']
  if !ex || (ex & exes).length == ex.length
    file_loc = loc
    break
  end
end
raise "config error" unless file_loc

test_files_dir = file_loc['location']

# copy files
FileUtils.rm_r(dir[:test].to_s) if File.exist?(dir[:test].to_s)

FileUtils.mkdir_p(dir[:test].to_s)
FileUtils.mkdir_p(dir[:target].to_s)

test_files = Dir.glob("#{dir[:build]}/#{test_files_dir}/*")
FileUtils.cp_r(test_files, dir[:test].to_s)

src_files = Dir.glob("#{dir[:src]}/*", File::FNM_DOTMATCH)
src_files.reject!{|f| f =~ /\/\.+$/}

FileUtils.cp_r(src_files, dir[:target].to_s)

# make input file
if !conf[:test].empty?
  input = dir[:test] + conf[:test]['input']
  FileUtils.rm(input) if File.exist?(input)
  open(input, 'w'){|io| exes.each{|x| io.puts(x)}}
end

# build
info = Dir.chdir(dir[:test].to_s) do
  last_comm = res_output = res = nil
  build_commands.each do |comm|
    last_comm = comm
    res_output = `#{comm}`
    res = $?.to_i
    break if res != 0
  end

  # make log
  info = {}
  info['id'] = post_tz
  info['src'] = dir[:src].to_s
  info['timestamp'] = Time.now.iso8601

  if res == 0 then
    ## success
    info['status'] = status_code[:complete]
  else
    ## fail
    info['status'] = status_code[:failure]
    info['detail'] = res_output
    info['command'] = last_comm
    info['return-code'] = res
  end

  info
end

Log.new(files[:log]).write(:build, post_tz, info)
