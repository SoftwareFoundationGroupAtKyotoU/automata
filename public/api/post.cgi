#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'fileutils'
require 'pathname'
require 'tempfile'
require 'tmpdir'
require 'time'
require 'kconv'

require_relative '../../lib/cgi_helper'
require_relative '../../lib/app'
require_relative '../../lib/report/exercise'
require_relative '../../lib/log'
require 'zip'

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
  require:  '必須なパラメータ "%s" が指定されませんでした',
  # 'parameter "%s" is required',
  invalid:  '不正なパラメータ "%s" が指定されました',
  # 'invalid parameter "%s"',
  closed: '提出期限の過ぎた課題 "%s" が指定されました',
  # 'closed report "%s"',
  capacity: '頻度が高すぎるためリクエストを拒否しました',
  # 'over capacity',
  unzip:    'アップロードされたファイルの展開に失敗しました'
  # 'unable to unzip the uploaded file',
}

helper = CGIHelper.new
app = App.new(helper.cgi.remote_user)
time = Time.now

id = 'report_id'
rep_id = helper.param(id)
raise ArgumentError, (err[:require] % id) unless rep_id

rep_schemes = app.conf[:scheme, :scheme] || []
rep_scheme_data = rep_schemes.find{|r| r['id'] == rep_id}
raise ArgumentError, (err[:invalid] % rep_id) unless rep_scheme_data
raise ArgumentError, (err[:closed] % rep_id) if rep_scheme_data['type'] == 'closed'


USER_DIR = app.user_dir(rep_id)
log_file = USER_DIR + App::FILES[:log]

begin
  begin
    src_dir = USER_DIR + time.iso8601 + 'src'
    raise RuntimeError, err[:capacity] if File.exist?(src_dir.to_s)

    FileUtils.mkdir_p(src_dir.to_s)
    file = helper.cgi.params['report_file'][0]

    if file.is_a?(StringIO) || file.path.nil? then
      tmp = Tempfile.open('report.zip')
      tmp.write(file.read)
      file = tmp
    end
    path = file.path
    file.close

    # extract archive file
    begin
      Zip::File.open(path) do |zip_file|
        zip_file.each do |entry|
          entry.extract("#{src_dir}/#{entry.name}")
        end
      end
    rescue => e
      app.logger.error("post.cgi failed to unzip \"#{path}\" with \"#{e.to_s}\"")
      raise RuntimeError, err[:unzip] unless res
    end

    entries = Dir.glob("#{src_dir}/*")

    # extract tar file
    if entries.length == 1 && entries[0] =~ /\.tar$/
      Dir.chdir(src_dir.to_s) do
        file = File.basename(entries[0])
        res = system("tar xf '#{file}' > /dev/null 2>&1")
        res = FileUtils.rm(file) rescue nil
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
    exs = helper.params['ex']
    exs = exs.map{|ex| ex.respond_to?(:read) ? ex.read : ex}
    exs = exs.sort{|a,b| a.to_ex <=> b.to_ex}
    Log.new(log_file).write(:data, time, 'status' => 'build', 'report' => exs)

    # build and run test
    cmd = App::FILES[:test_script]
    cmd = "#{cmd} --id=#{time.iso8601} '#{rep_id}' '#{app.user}'"
    cmd = "#{cmd} > /dev/null 2>&1"
    system(cmd)

    # GC
    until app.check_disk_usage(USER_DIR)
      break unless Log.new(log_file).transaction do |log|
        log.size > 1 && log.pop.tap do |id|
          FileUtils.rm_r((USER_DIR+id).to_s) if id
        end
      end
    end

  rescue RuntimeError => e
    entry = { 'status' => 'NG', 'log' => { 'error' => e.to_s } }
    Log.new(log_file).write(:data, time, entry)
  end
ensure
  print helper.cgi.header('status' => '302 Found', 'Location' => '../record/')
end
