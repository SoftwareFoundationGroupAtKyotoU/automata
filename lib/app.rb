# coding: utf-8
require 'pathname'
require 'strscan'
require 'time'

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

  # Return a user whose token or login is t_or_l
  # @param [String] token or login
  def user_from_token_or_login(t_or_l)
    (visible_users.select {|u| u.token == t_or_l || u.real_login == t_or_l})[0]
  end

  # Return delay options
  # @return [Array<String>] delay options from master.yml
  def delay_options
    delay_opts = []
    if conf[:master, :delay]
      conf[:master, :delay].each do |d|
        delay_opts << d['label'] if d && d['label']
      end
    end
    return delay_opts
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
      # add delay status of the report
      if su? and not yaml['initial_submit'].nil?
        if yaml['delay'].nil?
          yaml['delay'] = delay_status(id, yaml['initial_submit'])
        else
          unless delay_options.include?(yaml['delay'])
            logger.error("'#{yaml['delay']}' is not defined in master.yml.")
            yaml['delay'] = delay_status(id, yaml['initial_submit'])
          end
        end
      else
        yaml['delay'] = ''
      end
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

  private

  SCALE = [:day, :hour, :min, :sec]

  # Returns delay status
  # @param [String] report id
  # @param [String] time of the initial submit of the report
  # return [String] delay status of the report
  def delay_status(id, initial_submit)
    deadline_yml =
      (conf[:scheme, :scheme].find{|r| r['id']==id} || {})['deadline']
    return '' unless deadline_yml

    # Check if only the date of the deadline of the report are set
    deadline = Time.parse(deadline_yml['date']
                           .concat('T' + (deadline_yml['time'] || '23:59:59'))
                           .concat(deadline_yml['timezone'] || ''))
    deadline = deadline - 1 if deadline_yml['time']
    delay_sec = [(Time.parse(initial_submit) - deadline), 0].max.to_i
    # Time.at returns time based on a local time zone.
    # So we get the time in UTC in order to get exact delay time of submissions.
    delay = Time.at(delay_sec).getgm

    delay_time = {}
    delay_time[:day] = delay.day-1
    delay_time[:hour] = delay.hour
    delay_time[:min] = delay.min
    delay_time[:sec] = delay.sec

    delay_opts = conf[:master, :delay]
    labels = delay_options

    if labels && !labels.empty?
      delay_opts.each do |opt|
        return opt['label'] if opt['otherwise']

        satisfied = true
        # Check the condition associated with a label.
        # Return the label if the condition is satisfied.
        SCALE.each do |s|
          set_time = (opt[s.to_s] || 0)
          if delay_time[s] < set_time
            return opt['label']
          elsif delay_time[s] > set_time
            satisfied = false
            break
          end
        end
        return opt['label'] if satisfied
      end
      # Return the last label if no conditions are satisfied.
      return delay_opts.last['label']
    elsif delay_sec == 0
      return '遅れなし'
    else
      scale = {:day => '日と', :hour => '時間', :min => '分', :sec => '秒'}
      return SCALE.reduce('') do |str, s|
        str.concat((delay_time[s].to_s + scale[s] if delay_time[s] > 0) || '')
      end
    end
  end
end
