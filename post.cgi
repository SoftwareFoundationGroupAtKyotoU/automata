#! /usr/bin/env ruby
$KCODE = 'UTF8'

require 'fileutils'
require 'time'
require 'cgi'
require 'yaml'
require 'tempfile'
require 'tmpdir'
require 'time'

class Log
  def initialize(file, time)
    @file = file
    @time = time
    @log = YAML.load_file(file) rescue nil
    @log = { 'data' => [] } unless @log
  end

  def add(status, report=nil)
    val = {
      'status'    => status,
      'report'    => report,
      'timestamp' => @time.iso8601,
    }
    @log['data'].unshift(val)
    write
  end

  def err(msg)
    val = {
      'status'    => 'NG',
      'error'     => msg,
      'timestamp' => @time.iso8601,
    }
    @log['data'].unshift(val)
    write
  end

  private

  def write() open(@file, 'w'){|io| YAML.dump(@log, io)} end
end

files = {
  :local  => './local.yml',
  :scheme => './record/scheme.yml',
}

err = {
  :require  => 'parameter "%s" is required',
  :invalid  => 'invalid parameter "%s"',
  :capacity => 'over capacity',
  :unzip    => 'unable to unzip the uploaded file',
}

cgi = CGI.new
time = Time.now

yml = {}
files.each do |name, file|
  yml[name] = YAML.load_file(file) rescue yml[name] = {}
end

id = 'report_id'
rep_id = cgi.params[id][0].read
raise ArgumentError, (err[:require] % id) unless defined?(rep_id)

rep_schemes = yml[:scheme]['scheme']
rep_defined = rep_schemes.any?{|r| r['id'] == rep_id}
raise ArgumentError, (err[:invalid] % rep_id) unless rep_defined

user_name = cgi.remote_user || yml[:local]['user']
user_dir = File.join(File.dirname(__FILE__),
                     'kadai',
                     rep_id,
                     user_name)
log_file = File.join(user_dir, 'log.yml')
log = Log.new(log_file, time)

begin
  begin
    src_dir = File.join(user_dir,
                        time.iso8601,
                        'src')
    raise RuntimeError, err[:capacity] if File.exist?(src_dir)

    FileUtils.mkdir_p(src_dir)
    file = cgi.params['report_file'][0]

    unless file.path then
      tmp = Tempfile.open('report.zip')
      tmp.write(file.read)
      file = tmp
    end
    path = file.path
    file.close

    res = system("env unzip #{path} -d #{src_dir} > /dev/null 2>&1")
    raise RuntimeError, err[:unzip] unless res

    entries = Dir.glob("#{src_dir}/*")

    if entries.length == 1 && File.directory?(entries[0]) then
      entries_dir = entries[0]
      Dir.mktmpdir do |tmpdir|
        src_files = Dir.glob("#{entries_dir}/*", File::FNM_DOTMATCH)
        src_file.reject!{|f| f =~ /^\.+/}
        FileUtils.mv(src_files, tmpdir)
        FileUtils.rmdir(entries_dir)
        FileUtils.mv(Dir.glob("#{tmpdir}/*"), src_dir)
      end
    end

    report = []
    cgi.params.each do |k,v|
      report << k if k =~ /^Ex\.\d+/
    end
    log.add('build', report)

    # TODO: run checker
  rescue RuntimeError => e
    log.err(e.to_s)
  end
ensure
  print cgi.header('status' => '302 Found', 'Location' => './record/')
end
