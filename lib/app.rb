# coding: utf-8
require 'pathname'
require 'strscan'
require 'time'
require 'yaml'
require 'webrick'

require 'bundler/setup'

require_relative 'syspath'
require_relative 'clone'
require_relative 'conf'
require_relative 'log'
require_relative 'store'
require_relative 'user'
require_relative 'app/logger_ext'

class App
  attr_reader :conf

  def initialize(remote_user=nil)
    @remote_user = remote_user
    @conf = Conf.new
  end

  def logger()
    @logger = Logger.new(conf) unless @logger
    return @logger
  end

  def user
    @remote_user
  end

  def su?(u=nil)
    return conf[:master, :su].include?(u || user)
  end

  def user_dir(r)
    return KADAI + r + user
  end

  def users(all = false)
    if @users.nil? || all
      user_store = Store::YAML.new(SysPath::FILES[:data])
      user_store.ro.transaction do |store|
        @users = (store['data'] || []).map{|u| User.new(u)}
        @users.reject!{|u| u.login != user} unless conf[:master, :record, :open] || su? || all
        unless conf[:master, :record, :show_login] || su?
          # Override User#login to hide user login name
          @users.each{|u| def u.login() return token end}
        end
      end
    end
    return @users
  end

  # Add a user to the database.
  # @param [Hash{String => String}] info contains name, ruby, login, and email
  # @example
  #   app.add_user({
  #     'name' => 'Alice',
  #     'ruby' => 'Alice',
  #     'login' => 'alice',
  #     'email' => 'alice@wonderland.net'
  #   })
  # @return [User] the added user or nil if the person is already added
  def add_user(info)
    return nil if users.any? do |u|
      u.email == info['email'] || u.real_login == info['login']
    end
    FileUtils.touch SysPath::FILES[:data]
    user_store = Store::YAML.new(SysPath::FILES[:data])
    user_store.transaction do |store|
      store['data'] = (store['data'] || []) + [info]
    end
    @users = nil
    users.find do |u|
      u.email == info['email'] && u.real_login == info['login']
    end
    logger.info("User added: #{info}")
  end

  # Set a password for a user.
  # @param [String] real_login
  # @param [String] passwd
  def set_passwd(real_login, passwd)
    htdigest = conf[:master, :authn, :htdigest]
    realm = conf[:master, :authn, :realm]

    htd = WEBrick::HTTPAuth::Htdigest.new(htdigest)
    htd.set_passwd(realm, real_login, passwd)
    htd.flush
  end

  def modify_user(id, info)
    user_store = Store::YAML.new(SysPath::FILES[:data])
    user_store.transaction {|store|
      users = (store['data'] || [])
      users.map! {|user|
        if user['login'] == id
          user['name'] = info['name'] || user['name']
          user['ruby'] = info['ruby'] || user['ruby']
          user['email'] = info['email'] || user['email']
          user['assigned'] = info['assigned'] || user['assigned']
        end
        user
      }
      store['data'] = users
    }
    @users = nil
  end

  def delete_user(id)
    backup_dir = SysPath::BACKUP + Time.new.iso8601
    raise RuntimeError, '頻度が高すぎるためリクエストを拒否しました' if File.exist?(backup_dir)
    raise RuntimeError, 'Invalid delete id' if id.nil? || id.empty?
    FileUtils.mkdir_p(backup_dir)
    # remove and backup user directories
    Pathname.glob(SysPath::KADAI + '*').each {|path|
      path = path.expand_path
      src = (path + id).expand_path
      if File.exist?(src) && path.children.include?(src)
        dst = backup_dir + path.basename
        FileUtils.mv(src, dst)
      end
    }
    # remove user data
    user_store = Store::YAML.new(SysPath::FILES[:data])
    user_store.transaction {|store|
      users = (store['data'] || [])
      users.reject! {|user| user['login'] == id}
      store['data'] = users
    }
    # remove user passwd
    htdigest = conf[:master, :authn, :htdigest]
    realm = conf[:master, :authn, :realm]
    htd = WEBrick::HTTPAuth::Htdigest.new(htdigest)
    htd.delete_passwd(realm, id)
    htd.flush

    logger.info("User deleted: #{id}")
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
      fname = SysPath::user_log(id, u)
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
