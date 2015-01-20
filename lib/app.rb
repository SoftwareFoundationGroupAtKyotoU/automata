# coding: utf-8
require 'logger'
require 'pathname'
require 'strscan'
require 'yaml'

require 'bundler/setup'

require_relative 'util'
require_relative 'clone'
require_relative 'conf'
require_relative 'log'
require_relative 'store'
require_relative 'user'

class App
  DB     = Util.find_base(__FILE__, :db)
  KADAI  = DB + 'kadai'
  BUILD  = Util.find_base(__FILE__, :build)
  TESTER = Util.find_base(__FILE__, :test)
  SCRIPT = Util.find_base(__FILE__, :script)

  FILES = {
    data:          DB + 'data.yml',
    log:           'log.yml',
    build:         TESTER + 'build.rb',
    sandbox:       TESTER + 'test.rb',
    test_script:   SCRIPT + 'test'
  }

  LOGGER_LEVEL = {
    "FATAL" => Logger::FATAL,
    "ERROR" => Logger::ERROR,
    "WARN"  => Logger::WARN,
    "INFO"  => Logger::INFO,
    "DEBUG" => Logger::DEBUG,
  }

  def initialize(remote_user=nil)
    @remote_user = remote_user
    @conf = Conf.new
  end

  def file(name)
    @files ||= Hash.new do |h, k|
      File.open(FILES[k], 'r:utf-8'){|f| h[k] = YAML.load(f) }
    end
    return @files[name]
  end

  def logger()
    unless @logger
      @logger = Logger.new(conf[:master, :logger, :path])
      @logger.level = LOGGER_LEVEL[conf[:master, :logger, :level]]
    end
    return @logger
  end

  def conf()
    return @conf
  end

  def user()
    @user ||= conf[:master, :user] || @remote_user || ENV['USER']
    return @user
  end

  def su?(u=nil)
    return conf[:master, :su].include?(u || user)
  end

  def user_dir(r)
    return KADAI + r + user
  end

  def users(all = false)
    if @users.nil? || all
      user_store = Store::YAML.new(FILES[:data])
      user_store.ro.transaction do |store|
        @users = (store['data'] || []).map{|u| User.new(u)}
        @users.reject!{|u| u.login != user} unless conf[:master, :record, :open] || su? || all
        unless conf[:master, :record, :show_login]
          # Override User#login to hide user login name
          @users.each{|u| def u.login() return token end}
        end
      end
    end
    return @users
  end

  def add_user(name, ruby, login, email)
    user_store = Store::YAML.new(FILES[:data])
    user_store.transaction do |store|
      users = (store['data'] || [])
      users << {'name' => name, 'ruby' => ruby, 'login' => login, 'email' => email}
      store['data'] = users
      @users = nil
    end
  end

  def user_from_token(token)
    return users.inject(nil) do |r, u|
      (u.token == token || u.real_login == token) ? u.real_login : r
    end
  end

  # Returns user names correspond to tokens.
  # @param [Array<String>] tokens an array of tokens
  # @param [Hash<String, String>] a hash represents relation between
  # tokens and names.
  def user_names_from_tokens(tokens)
    users(true).inject(Hash.new) do |r, u|
      token = tokens.find {|t| u.token == t || u.real_login == t}
      token.nil? ? r : r.merge({ token => u.name })
    end
  end

  def report(option, id, u)
    require_relative 'report'

    status = option[:status]
    log = option[:log]

    src = nil
    optional = []
    optional << :log if option[:log]

    type = (conf[:scheme, :scheme].find{|r| r['id']==id} || {})['type']

    if (type == 'post') or (type == 'closed')
      fname = KADAI + id + u + FILES[:log]
      return nil unless File.exist?(fname)
      yaml = Log.new(fname, true).latest(:data)
      # add timestamp of initial submit
      yaml['initial_submit'] = Log.new(fname, true).oldest(:data)['id']
      src = Report::Source::Post.new(yaml, optional)
    else
      yaml = file(:data) rescue {}
      yaml = yaml['data'] || {}
      yaml = yaml.find{|x| x['login'] == u} || {}
      yaml = yaml['report'] || {}
      yaml = yaml[id] || {}
      timestamp = File.mtime(FILES[:data]).iso8601
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

  def check_disk_usage(dir)
    dir = Pathname.new(dir.to_s) unless dir.is_a?(Pathname)

    checkers = {
      size: proc{ StringScanner.new(`du -sk "#{dir}"`).scan(/\d+/).to_i },
      entries: proc do
        if (dir + App::FILES[:log]).exist?
          Log.new(dir + App::FILES[:log]).size
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
