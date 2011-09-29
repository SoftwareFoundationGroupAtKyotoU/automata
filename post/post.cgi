#! /usr/bin/env ruby
$KCODE = 'UTF8'

$:.unshift('./lib')

require 'fileutils'
require 'pathname'
require 'tempfile'
require 'tmpdir'
require 'time'
require 'kconv'

require 'app'
require 'report/exercise'
require 'log'

class Pathname
  def toutf8() return to_s.toutf8 end
  def entries2utf8()
    each_entry do |e|
      unless e.to_s =~ /^\.+$/
        Dir.chdir(to_s) do
          e.entries2utf8 if e.directory?
          utf8 = e.toutf8
          e.rename(utf8) if utf8 != e.to_s
        end
      end
    end
  end
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
rep_id = app.param(id)
raise ArgumentError, (err[:require] % id) unless rep_id

rep_schemes = app.file(:scheme)['scheme'] || []
rep_defined = rep_schemes.any?{|r| r['id'] == rep_id}
raise ArgumentError, (err[:invalid] % rep_id) unless rep_defined

USER_DIR = app.user_dir(rep_id)
log_file = USER_DIR[App::FILES[:log]]

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

    # extract archive file
    res = system("env 7z x -o#{src_dir} #{path} > /dev/null 2>&1")
    raise RuntimeError, err[:unzip] unless res

    entries = Dir.glob("#{src_dir}/*")

    # extract tar file
    if entries.length == 1 && entries[0] =~ /\.tar$/
      Dir.chdir(src_dir.to_s) do
        file = File.basename(entries[0])
        res = system("tar xf '#{file}' > /dev/null 2>&1 && rm '#{file}'")
      end
      raise RuntimeError, err[:unzip] unless res
      entries = Dir.glob("#{src_dir}/*")
    end

    # move files from a single directory to the parent directory
    if entries.length == 1 && File.directory?(entries[0]) then
      entries_dir = entries[0]
      Dir.mktmpdir do |tmpdir|
        src_files = Pathname.new(entries_dir).entries
        src_files.reject!{|f| f.to_s=~/^\.+$/}
        Dir.chdir(entries_dir){ FileUtils.mv(src_files, tmpdir) }
        FileUtils.rmdir(entries_dir)
        FileUtils.mv(Dir.glob("#{tmpdir}/*"), src_dir.to_s)
      end
    end

    # convert file names to utf8
    src_dir.entries2utf8

    # solved exercises
    exercises = app.params['ex']
    exercises = exercises.map{|ex| ex.respond_to?(:read) ? ex.read : ex}
    exercises = exercises.sort{|a,b| a.to_ex <=> b.to_ex}
    Log.new(log_file, time) do |log|
      log.write_data('status' => 'build', 'report' => exercises)
    end

    # build and run test
    cmd = App::FILES[:test_script]
    cmd = "#{cmd} --id=#{time.iso8601} '#{rep_id}' '#{app.user}'"
    cmd = "#{cmd} > /dev/null 2>&1"
    system(cmd)

  rescue RuntimeError => e
    Log.new(log_file, time) do |log|
      log.write_data('status' => 'NG', 'log' => { 'error' => e.to_s })
    end
  end
ensure
  print app.cgi.header('status' => '302 Found', 'Location' => '../record/')
end
