#! /usr/bin/env ruby

Dir.chdir(File.dirname(File.expand_path($0)))
$:.unshift('./lib')

require 'fileutils'
require 'yaml'
require 'time'

require 'app'

report_id = $*.shift
user      = $*.shift
post_tz   = $*.shift
exercises = $*

dir = {}
dir[:user]   = App::KADAI + report_id + user
dir[:test]   = dir[:user] + 'test'
dir[:src]    = dir[:user] + post_tz + 'src'
dir[:target] = dir[:test] + 'src'

files = {
  :log    => dir[:user][App::FILES[:log]],
  :config => App::FILES[:master],
}

yml = {}
files.each do |name, file|
  yml[name] = YAML.load_file(file) rescue {}
end
yml[:build] = yml[:config]['build']

build_commands = yml[:build]['command']
status_code = {
  :failure  => 'NG',
  :complete => 'OK',
}

file_loc = nil
(yml[:build]['file_location'][report_id] || []).each do |loc|
  ex = loc['exercise']
  if !ex || (ex & exercises).length = ex.length
    file_loc = loc
    break
  end
end
raise "config error" unless file_loc

test_files_dir = file_loc['location']

# copy files
unless File.exist?(dir[:test].to_s) then
  FileUtils.mkdir_p(dir[:test].to_s)
  FileUtils.mkdir_p(dir[:target].to_s)
end
test_files = Dir.glob("#{test_files_dir}/*")
FileUtils.cp_r(test_files, dir[:test].to_s)

src_files = Dir.glob("#{dir[:src]}/*", File::FNM_DOTMATCH)
src_files.reject!{|f| f =~ /\/\.+$/}

FileUtils.cp_r(src_files, dir[:target].to_s)

# build
log_yml = Dir.chdir(dir[:test].to_s) do
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

  log_yml = yml[:log]
  build = log_yml['build'] || []
  build.unshift(info)
  log_yml['build'] = build

  log_yml
end

File.open(files[:log], 'w'){|io| YAML.dump(log_yml, io)}
