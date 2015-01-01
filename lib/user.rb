require 'digest/md5'

class User
  def self.make_token(str)
    return 'id' + Digest::MD5.hexdigest(str)
  end

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
  def []=(k, rep) @report[k] = rep if rep end

  def to_hash()
    hash = {
      'login'    => login,
      'token'    => token,
      'name'     => name,
      'ruby'     => ruby,
    }
    hash['report'] = {} unless report.empty?
    report.each{|k,v| hash['report'][k] = v.to_hash}
    return hash
  end
end
