#! /usr/bin/env ruby
$KCODE = 'UTF8'

$:.unshift('./lib')

require 'fileutils'
require 'time'
require 'yaml'
require 'tempfile'
require 'tmpdir'
require 'time'

$base_dir = '.'
require 'app'

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
      'log'       => { 'error' => msg },
      'timestamp' => @time.iso8601,
    }
    @log['data'].unshift(val)
    write
  end

  private

  def write() open(@file, 'w'){|io| YAML.dump(@log, io)} end
end

err = {
  :require  => '必須なパラメータ "%s" が指定されませんでした',
  # 'parameter "%s" is required',
  :invalid  => '不正なパラメータ "%s" が指定されました',
  # 'invalid parameter "%s"',
  :capacity => '頻度が高すぎるためリクエストを拒否しました',
  # 'over capacity',
  :unzip    => 'アップロードされたファイルの展開に失敗しました',
  # 'unable to unzip the uploaded file',
}

app = App.new
time = Time.now

id = 'report_id'
rep_id = app.cgi.params[id][0].read
raise ArgumentError, (err[:require] % id) unless defined?(rep_id)

rep_schemes = app.file(:scheme)['scheme'] || []
rep_defined = rep_schemes.any?{|r| r['id'] == rep_id}
raise ArgumentError, (err[:invalid] % rep_id) unless rep_defined

user_name = app.user
USER_DIR = App::KADAI + rep_id + user_name
log_file = USER_DIR['log.yml']
log = Log.new(log_file, time)

begin
  begin
    src_dir = USER_DIR + time.iso8601 + 'src'
    raise RuntimeError, err[:capacity] if File.exist?(src_dir.to_s)

    FileUtils.mkdir_p(src_dir.to_s)
    file = app.cgi.params['report_file'][0]

    unless file.path then
      tmp = Tempfile.open('report.zip')
      tmp.write(file.read)
      file = tmp
    end
    path = file.path
    file.close

    res = system("env 7z x -o#{src_dir} #{path} > /dev/null 2>&1")
    raise RuntimeError, err[:unzip] unless res

    entries = Dir.glob("#{src_dir}/*")

    if entries.length == 1 && File.directory?(entries[0]) then
      entries_dir = entries[0]
      Dir.mktmpdir do |tmpdir|
        src_files = Dir.glob("#{entries_dir}/*", File::FNM_DOTMATCH)
        src_files.reject!{|f| f =~ /\/\.+$/}
        FileUtils.mv(src_files, tmpdir)
        FileUtils.rmdir(entries_dir)
        FileUtils.mv(Dir.glob("#{tmpdir}/*"), src_dir.to_s)
      end
    end

    report = []
    app.cgi.params.each do |k,v|
      report << k if k =~ /^Ex\.\d+/
    end
    log.add('build', report)

    # TODO: run checker
  rescue RuntimeError => e
    log.err(e.to_s)
  end
ensure
  print app.cgi.header('status' => '302 Found', 'Location' => './record/')
end
