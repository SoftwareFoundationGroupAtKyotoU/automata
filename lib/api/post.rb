# -*- coding: utf-8 -*-

require 'fileutils'
require 'find'
require 'pathname'
require 'tempfile'
require 'tmpdir'
require 'time'
require 'kconv'

require_relative '../helper'
require_relative '../syspath'
require_relative '../app'
require_relative '../user'
require_relative '../report/exercise'
require_relative '../log'
require_relative '../zip/unzip'

module API
  class Post
    ERR = {
      require:  '必須なパラメータ "%s" が指定されませんでした',
      # 'parameter "%s" is required',
      invalid:  '不正なパラメータ "%s" が指定されました',
      # 'invalid parameter "%s"',
      closed: '提出期限の過ぎた課題 "%s" が指定されました',
      # 'closed report "%s"',
      capacity: '頻度が高すぎるためリクエストを拒否しました',
      # 'over capacity',
      unzip:    'アップロードされたファイルの展開に失敗しました',
      # 'unable to unzip the uploaded file',
      prerequisite: '提出ファイルの要件を満たしていません'
      # 'unfilled prerequisistes for files',
    }

    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])
      time = Time.now

      rep_id = helper.params['report_id']
      # return Bad Request if 'report_id' parameter is not passed.
      return helper.bad_request(ERR[:require] % 'report_id') unless rep_id

      rep_schemes = app.conf[:scheme, :scheme] || []
      rep_scheme_data = rep_schemes.find{|r| r['id'] == rep_id }
      return helper.bad_request(ERR[:invalid] % rep_id) unless rep_scheme_data
      return helper.forbidden(ERR[:closed] % rep_id) if rep_scheme_data['type'] == 'closed'

      log_file = SysPath::user_log(rep_id, app.user)
      src_dir = SysPath::user_src_dir(rep_id, app.user, time.iso8601)
      return helper.forbidden(ERR[:capacity]) if File.exist?(src_dir)

      FileUtils.mkdir_p(src_dir)
      file = helper.params['report_file'][:tempfile]

      # FIXME: file must not be StringIO
      if file.is_a?(StringIO) || file.path.nil?
        tmp = Tempfile.open('report.zip')
        tmp.write(file.read)
        file = tmp
      end
      path = file.path
      file.close

      # extract archive file
      begin
        Zip::File.unzip(path, src_dir)
      rescue => e
        app.logger.error("post.cgi failed to unzip \"#{path}\" with \"#{e}\"")
        return helper.internal_server_error(ERR[:unzip])
      end

      entries = Dir.glob("#{src_dir}/*")

      # extract tar file
      if entries.length == 1 && entries[0] == /\.tar$/
        file = File.basename(entries[0])
        system("tar xf '#{file}' > /dev/null 2>&1", { chdir: src_dir })
        FileUtils.rm(entries[0]) rescue nil
        entries = Dir.glob("#{src_dir}/*")
      end

      check = app.conf[:master, :check] || {}
      ignore = ((check['default'] || {}).merge((check[rep_id] || {})))['ignore']
      ignore = ignore || '(?!.*)'
      ignore = '(?:'+ignore.join('|')+')' if ignore.is_a?(Array)

      # lift directories
      lift_dir(app, rep_id, ignore, src_dir)

      # clean entries
      Find.find(src_dir.to_s) do |f|
        next if File.directory?(f)
        FileUtils.rm(f) if f =~ /#{ignore}/
      end

      # check requirements
      files = Dir.glob("#{src_dir}/*").map { |x| File.basename(x) }
      check = app.conf[:master, :check] || {}
      reqs = ((check['default'] || {})['require']) ||
             ((check[rep_id] || {})['require']) ||
             []
      unless reqs.all? { |r| files.include?(r) }
        FileUtils.rm_rf(src_dir.parent.to_s)
        fail ERR[:prerequisite]
      end

      # convert file names to utf8
      entries2utf8(src_dir)

      # solved exercises
      exs = helper.params['ex']
      return helper.bad_request(ERR[:require] % 'ex') if exs.nil?

      exs = [exs] unless exs.is_a?(Array)
      exs = exs.map { |ex| ex.respond_to?(:read) ? ex.read : ex }
      exs = exs.sort { |a, b| a.to_ex <=> b.to_ex }
      Log.new(log_file).write(:data, time, 'status' => 'build', 'report' => exs)

      # build and run test
      cmd = SysPath::FILES[:test_script]
      cmd = "#{cmd} --id=#{time.iso8601} '#{rep_id}' '#{app.user}'"
      cmd = "#{cmd} > /dev/null 2>&1"
      system(cmd)

      # GC
      until app.check_disk_usage(SysPath::user_dir(rep_id, app.user))
        break unless Log.new(log_file).transaction do |log|
          log.size > 1 && log.pop.tap do |id|
            FileUtils.rm_r(SysPath::user_post_dir(rep_id, app.user, id).to_s) if id
          end
        end
      end

      helper.redirect("../record/#/#{::User.make_token(app.user)}/#{rep_id}/")
    rescue RuntimeError => e
      entry = { 'status' => 'NG', 'log' => { 'error' => e.to_s } }
      Log.new(log_file).write(:data, time, entry)
      helper.redirect('../record/')
    end

    private

    def entries2utf8(path)
      path.children do |e|
        entries2utf8(e) if e.directory?
        utf8 = e.to_s.toutf8
        e.rename(utf8) if utf8 != e.to_s
      end
    end

    def lift_dir(app, rep_id, ignore, src_dir)
      # remove ignored files
      Dir.glob("#{src_dir}/*", File::FNM_DOTMATCH) do |e|
        FileUtils.rm_rf((src_dir+e).to_s) if e =~ /#{ignore}/
      end

      # move files from a single directory to the parent directory
      entries = Dir.glob("#{src_dir}/*")
      if entries.length == 1 && File.directory?(entries[0]) then
        entries_dir = entries[0]
        Dir.mktmpdir do |tmpdir|
          src_files = Pathname.new(entries_dir).children
          FileUtils.mv(src_files, tmpdir)
          FileUtils.rmdir(entries_dir)
          FileUtils.mv(Dir.glob("#{tmpdir}/*"), src_dir.to_s)
        end
        lift_dir(app, rep_id, ignore, src_dir)
      end
    end
  end
end
