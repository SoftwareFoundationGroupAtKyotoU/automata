# -*- coding: utf-8 -*-

require 'bundler/setup'

require 'time'
require 'digest/md5'
require 'webrick'

require_relative 'store'
require_relative 'syspath'
require_relative 'conf'
require_relative 'app/logger_ext'

class User

  # Return a user whose login is login
  # @param [String] login
  def self.from_login(login)
    (self.all_users.select {|u| u.real_login == login})[0]
  end

  # Add a user to the database.
  # @param [Hash{String => String}] info contains name, ruby, login, email, and
  # assigned
  # @example
  #   User::add({
  #     'name'      => 'Alice',
  #     'ruby'      => 'Alice',
  #     'login'     => 'alice',
  #     'email'     => 'alice@wonderland.net',
  #     'assigned'  => 'Bob'
  #   })
  # @return [Bool] whether addition of an user succeeds or nor
  def self.add(info)
    return false if self.all_users.any? do |u|
      u.email == info['email'] || u.real_login == info['login']
    end

    FileUtils.touch SysPath::FILES[:data]
    store.transaction do |store|
      store['data'] = (store['data'] || []) + [info]
    end

    self.set_passwd(info['login'], info['passwd']) unless info['passwd'].nil?

    App::Logger.new.info("User added: #{info}")

    return true
  end

  # Modify user information
  # @param [User] modified user
  # @param [Hash{String => String}] info contains name, ruby, login, email, or
  # assigned; see also self.add.
  def self.modify(user, info)
    login = user.real_login
    store.transaction do |store|
      users = (store['data'] || [])
      users.map! do |u|
        if u['login'] == login
          u['name'] = info['name'] || u['name']
          u['ruby'] = info['ruby'] || u['ruby']
          u['email'] = info['email'] || u['email']
          u['assigned'] = info['assigned'] || u['assigned']
        end
        u
      end
      store['data'] = users
    end

    self.set_passwd(login, info['passwd']) unless info['passwd'].nil?
  end

  # Delete user information
  # @param [User] deleted user
  def self.delete(user)
    login = user.real_login
    backup_dir = SysPath::BACKUP + Time.new.iso8601
    raise RuntimeError, '頻度が高すぎるためリクエストを拒否しました' if File.exist?(backup_dir)
    raise RuntimeError, 'Invalid delete id' if login.nil? || login.empty?
    FileUtils.mkdir_p(backup_dir)
    # remove and backup user directories
    Pathname.glob(SysPath::KADAI + '*').each do |path|
      path = path.expand_path
      src = (path + login).expand_path
      if File.exist?(src) && path.children.include?(src)
        dst = backup_dir + path.basename
        FileUtils.mv(src, dst)
      end
    end

    # remove user data
    store.transaction {|store|
      users = (store['data'] || [])
      users.reject! {|u| u['login'] == login}
      store['data'] = users
    }

    # remove user password
    self.delete_passwd(login)

    App::Logger.new.info("User deleted: #{login}")
  end

  # Make a token for a user login
  # @param [String] encoded login
  def self.make_token(str)
    return 'id' + Digest::MD5.hexdigest(str)
  end

  # Return all users
  # @return [Array(User)] saved users
  def self.all_users
    self.store.ro.transaction do |store|
      (store['data'] || []).map do |u|
        self.new(u)
      end
    end
  end

  private

  def self.store
    Store::YAML.new(SysPath::FILES[:data])
  end

  # Set a password for a user.
  # @param [String] real_login
  # @param [String] passwd
  def self.set_passwd(login, passwd)
    conf = Conf.new
    htdigest = conf[:master, :authn, :htdigest]
    realm = conf[:master, :authn, :realm]

    htd = WEBrick::HTTPAuth::Htdigest.new(htdigest)
    htd.set_passwd(realm, login, passwd)
    htd.flush
  end

  # Set a password for a user.
  # @param [String] real_login
  def self.delete_passwd(login)
    conf = Conf.new
    htdigest = conf[:master, :authn, :htdigest]
    realm = conf[:master, :authn, :realm]

    htd = WEBrick::HTTPAuth::Htdigest.new(htdigest)
    htd.delete_passwd(realm, login)
    htd.flush
  end

  public

  attr_reader :report
  def initialize(user)
    @user = user
    @report = {}
  end

  def real_login() return @user['login'] end
  def token() return self.class.make_token(real_login) end
  def login() return real_login end
  def name() return @user['name'] end
  def ruby() return @user['ruby'] end
  def email() return @user['email'] end
  def assigned() return @user['assigned'] end
  def []=(k, rep) @report[k] = rep if rep end

  def to_hash()
    hash = {
      'login'    => login,
      'token'    => token,
      'name'     => name,
      'ruby'     => ruby,
      'email'    => email,
      'assigned' => assigned,
    }
    hash['report'] = {} unless report.empty?
    report.each{|k,v| hash['report'][k] = v.to_hash}
    return hash
  end
end
