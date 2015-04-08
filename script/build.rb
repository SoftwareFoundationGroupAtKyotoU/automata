#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

Dir.chdir(File.dirname(File.expand_path($0)))

require 'fileutils'
require 'yaml'
require 'time'

require_relative 'helper'
require_relative '../lib/app'
require_relative '../lib/log'
require_relative '../lib/report/exercise'

report_id = $*.shift
user      = $*.shift
post_tz   = $*.shift
exes = $*
exes = ARGF.file.readlines.map(&:strip).reject(&:empty?) if exes.empty?

helper = Helper.new(report_id, user, post_tz)

dir = {}
dir[:test]   = helper.dir[:user] + 'test'
dir[:target] = dir[:test] + 'src'
dir[:build]  = App::BUILD

yml = {}
helper.file.each{|name, file| yml[name] = YAML.load_file(file)||{} rescue {} }

conf = {}
[:build, :test].each do |k|
  conf[k] = helper.merged_conf(:master, :check, :default, k)
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

test_files_dir = (file_loc || {})['location']

# copy files
FileUtils.rm_r(dir[:test].to_s) if File.exist?(dir[:test].to_s)

helper.copy_src_files(dir[:target].to_s)

if test_files_dir
  test_files = Dir.glob("#{dir[:build]}/#{test_files_dir}/*")
  FileUtils.cp_r(test_files, dir[:test].to_s)
end

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
  info['src'] = helper.dir[:src].to_s
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

Log.new(helper.file[:log]).write(:build, post_tz, info)
