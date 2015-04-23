# coding: utf-8
require 'pathname'
require 'strscan'

require 'bundler/setup'

require_relative 'syspath'
require_relative 'conf'
require_relative 'log'
require_relative 'user'
require_relative 'app/logger_ext'

class App
  attr_reader :conf, :user

  # @param [String] login id of a remote user
  def initialize(remote_user=nil)
    @user = User.from_login(remote_user)
    @conf = Conf.new
  end

  # Returns a logger object
  # @return [App::Logger] which refers to app.conf
  def logger()
    @logger = Logger.new(conf) unless @logger
    return @logger
  end

  # Returns whetehr app.user is a super user
  # @return [bool]
  def su?
    return !user.nil? && conf[:master, :su].include?(user.real_login)
  end

  # Return users visible from a remote user
  # @return [Array<User>] users visible from a remote user or nil if a remote
  # user is not set
  def visible_users
    return nil if user.nil?

    users = User.all_users
    unless conf[:master, :record, :open] || su?
      users.reject!{|u| u.login != user.login}
    end
    unless conf[:master, :record, :show_login] || su?
      # Override User#login to hide user login name
      users.each{|u| def u.login() return token end}
    end
    return users
  end

  # Returns a report status
  # @param [Hash{Symbol => String}] option maps:
  #  status: => 'solved'|'record'|otherwise
  #    specifies a form reporesetnting a report status
  #  log:    => bool
  #    if :log is specified, then the report status contains log information
  # @param [String] report id
  # @param [User] user who submitted the report
  # @return [Report Object] in report.rb
  def report(option, id, u)
    require_relative 'report'

    status = option[:status]
    log = option[:log]

    src = nil
    optional = []
    optional << :log if option[:log]

    type = (conf[:scheme, :scheme].find{|r| r['id']==id} || {})['type']

    if (type == 'post') or (type == 'closed')
      fname = SysPath.user_log(id, u)
      return nil unless File.exist?(fname)
      yaml = Log.new(fname, true).latest(:data)
      # add timestamp of initial submit
      yaml['initial_submit'] = Log.new(fname, true).oldest(:data)['id']
      src = Report::Source::Post.new(yaml, optional)
    else
      yaml = file(:data) rescue {}
      yaml = yaml['data'] || {}
      yaml = yaml.find{|x| x['login'] == u.real_login} || {}
      yaml = yaml['report'] || {}
      yaml = yaml[id] || {}
      timestamp = File.mtime(SysPath::FILES[:data]).iso8601
      src = Report::Source::Manual.new(yaml, optional, timestamp)
    end

    case status
    when 'solved'
      return Report::Solved.new(src)
    when 'record'
      scheme = conf[:scheme, :report, id] || {}
      return Report::Record.new(src, scheme)
    else
      return src
    end
  end

  # Returns whetehr a directory consumes too capacity of a file system
  # @param [String, Pathname] a path to a checked directory
  # return [bool]
  def check_disk_usage(dir)
    dir = Pathname.new(dir.to_s) unless dir.is_a?(Pathname)

    checkers = {
      size: proc{ StringScanner.new(`du -sk "#{dir}"`).scan(/\d+/).to_i },
      entries: proc do
        if (dir + SysPath::FILES[:log]).exist?
          Log.new(dir + SysPath::FILES[:log]).size
        else
          Pathname.new(dir).children.select(&:directory?).size
        end
      end,
    }

    checkers.each do |k,f|
      c = conf[:master, :post, :limit, k]
      return false if c && c != 0 && c < f[]
    end

    return true
  end
end
