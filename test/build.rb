#! /usr/bin/env ruby

require 'fileutils'
require 'yaml'
require 'time'

report_id = ARGV[0]
user_dir  = ARGV[1]
post_tz   = ARGV[2]
exercises = ARGV[3, ARGV.length - 3] || []

dir = {
  :test => File.join(user_dir, 'test'),
  :src  => File.join(user_dir, post_tz, 'src'),
  :test_target => File.join(user_dir, 'test', 'src'),
}

files = {
  :log => File.join(user_dir, 'log.yml'),
  :config => File.join(File.dirname(__FILE__), '..', 'config.yml'),
}

yml = {}
files.each do |name, file|
  yml[name] = YAML.load_file(file) rescue yml[name] = {}
end
yml[:build] = yml[:config]['build']

build_commands = yml[:build]['command']
status_code = {
  :failure  => 'NG',
  :complete => 'build',
}

file_loc = nil
yml[:build]['file_location'].each do |loc|
  next if report_id != loc['id'];
  unless loc['exercise'] then
    file_loc = loc
    break
  end
  if (loc['exercise'] & exercises).length == loc['exercise'].length then
    file_loc = loc
    break
  end
end
raise "config error" unless file_loc

test_files_dir = File.join(File.dirname(__FILE__), file_loc['location'])

# copy files
unless File.exist?(dir[:test]) then
  FileUtils.mkdir_p(dir[:test])
  FileUtils.mkdir_p(dir[:test_target])
end
test_files = Dir.glob("#{test_files_dir}/*")
FileUtils.cp_r(test_files, dir[:test])

src_files = Dir.glob("#{dir[:src]}/*", File::FNM_DOTMATCH)
src_files.reject!{|f| f =~ /\/\.+$/}

FileUtils.cp_r(src_files, dir[:test_target])

# build
FileUtils.cd(dir[:test])

last_comm = res_output = res = nil
build_commands.each do |comm|
  last_comm = comm
  res_output = `#{comm}`
  res = $?.to_i
  break if res != 0
end

# make log
info = {}
info['src'] = dir[:src]
info['date'] = Time.now.iso8601

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
build = log_yml['build'] ||= []
build.push(info)
log_yml['build'] = build

file = File.open(files[:log], 'w')
YAML.dump(log_yml, file)
file.close
