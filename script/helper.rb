# -*- coding: utf-8 -*-

require_relative '../lib/syspath'
require_relative '../lib/app'
require_relative '../lib/conf'
require_relative '../lib/log'

class Helper

  def self.parse_args(a)
    args = a.dup
    help = %w'-h --help'.any?{|x| args.delete(x)}
    id = nil
    args.reject!{|x| x=~/^--id=(.*)$/ && id=$1}
    report_id = args.shift
    user = args.shift

    if help || !report_id || !user
      nil
    else
      Helper.new(report_id, user, id)
    end
  end

  def self.help_message
    <<"EOM"
Usage: #{$0} [-h] [--id=YYYY-MM-DDThh:mm:ss+zzzz] report-id user
EOM
  end

  attr_reader :report_id, :user, :id, :log

  def initialize(report_id, user, id)
    @report_id = report_id
    @user = user
    @id = id
    @log = @id ?
      Log.new(log_file, true).retrieve(:data, @id) :
      Log.new(log_file, true).latest(:data)
  end

  def log_file
    SysPath::user_log(report_id, user)
  end

  def dir
    {
      user: SysPath::user_dir(report_id, user),
      src:  SysPath::user_src_dir(report_id, user, log['id'])
    }
  end

  def copy_src_files(dst)
    FileUtils.rm_r(dst) if File.exist?(dst)
    FileUtils.mkdir_p(dst)

    src_files = Dir.glob("#{dir[:src]}/*", File::FNM_DOTMATCH)
    src_files.reject!{|f| f =~ /\/\.+$/}

    FileUtils.cp_r(src_files, dst)
  end

  def merged_conf(file, *keys)
    merged_conf_iter((Conf.new)[file], {}, keys.first, keys.drop(1))
  end

  private

  def merged_conf_iter(conf, c, key, rest)
    keys = key == :default ? [:default, report_id] : [key]
    keys.reduce(c) do |c, k|
      nconf = conf[k.to_s] || {}
      if rest.empty?
        c.merge(nconf.to_hash)
      else
        merged_conf_iter(nconf, c, rest.first, rest.drop(1))
      end
    end
  end
end
