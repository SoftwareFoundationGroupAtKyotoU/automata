#! /usr/bin/env ruby
$KCODE = 'UTF8'

require 'fileutils'
require 'time'
require 'cgi'
require 'yaml'
require 'tempfile'
require 'tmpdir'

cgi = CGI.new
user_name = cgi.remote_user

files = {
  :scheme => './record/scheme.yml',
}

yml = {}
files.each do |name, file|
  yml[name] = YAML.load_file(file) rescue yml[name] = {}
end

return unless defined?(cgi.params['report_id'][0].read)

rep_id = cgi.params['report_id'][0].read
rep_schemes = yml[:scheme]['scheme']
rep_schemes.reject!{|r| r['id'] == rep_id}
return if rep_schemes.length == 0

src_dir = [
       File.dirname(__FILE__),
       'kadai',
       rep_id,
       user_name, 
       Time.now.strftime('%Y-%m-%d-%H-%M-%S'),
       'src',
      ].join('/')
return if File.exist?(src_dir)

FileUtils.mkdir_p(src_dir)
file = cgi.params['report_file'][0]

unless file.path then
  tmp = Tempfile.open('report.zip')
  tmp.write(file.read)
  file = tmp
end
path = file.path
file.close

rc = system("env unzip #{path} -d #{src_dir} > /dev/null 2>&1")
return unless rc

entries = Dir.glob("#{src_dir}/*")

if entries.length == 1 && File.ftype(entries[0]) == 'directory' then
  entries_dir = entries[0]
  Dir.mktmpdir do |tmpdir|
    FileUtils.mv(Dir.glob("#{entries_dir}/*"), tmpdir)
    FileUtils.rmdir(entries_dir)
    FileUtils.mv(Dir.glob("#{tmpdir}/*"), src_dir)
  end
end
p 'OK'
