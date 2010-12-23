require 'cgi'
require 'yaml'
require 'clone'

require 'rubygems'
require 'json'

class App
  class Location
    def initialize(*dirs)
      @dirs = dirs
    end

    def to_s() return File.join(*@dirs) end

    def +(x)
      path = @dirs+[x]
      return Location.new(*path)
    end

    def [](*path)
      loc = self
      loc = loc + path.shift() while path.length > 0
      return loc.to_s
    end
  end

  BASE = '..'
  CONFIG = Location.new(BASE, 'config')
  DB = Location.new(BASE, 'db')
  KADAI = DB + 'kadai'

  FILES = {
    :master => CONFIG['config.yml'],
    :local  => CONFIG['local.yml'],
    :scheme => CONFIG['scheme.yml'],
    :data   => DB['data.yml'],
    :log    => 'log.yml',
  }

  attr_reader :cgi

  def initialize()
    @cgi = CGI.new
    cb = (@cgi.params['callback'][0] || '').strip
    cb = nil if cb.length == 0 && cb !~ /^\$?[a-zA-Z0-9\.\_\[\]]+$/
    @callback = cb
    @files = {}
    @conf = nil
    @user = nil
    @users = nil
  end

  def header()
    ctype = @callback ? 'text/javascript' : 'application/json'
    return "Content-Type: #{ctype}; charset=utf-8\r\n\r\n"
  end

  def file(name)
    @files[name] = YAML.load_file(FILES[name]) unless @files[name]
    return @files[name]
  end

  def params() return @cgi.params end

  def optional(key)
    param = params[key.to_s].deep_copy
    def param.include?(x) return empty? ? true : member?(x) end
    return param
  end

  def json(data)
    data = data.to_json
    data = "#{@callback}(#{data});" if @callback
    return data
  end

  def conf()
    unless @conf
      require 'conf'
      @conf = Conf.new(file(:master))
    end
    return @conf
  end

  def user()
    @user = cgi.remote_user || file(:local)['user'] unless @user
    return @user
  end

  def users()
    unless @users
      require 'user'
      @users = file(:data)['data'].map{|u| User.new(u)}
      @users.reject!{|u| u.login != user} unless conf.su?(user)
    end
    return @users
  end

  def report(type, id, u)
    require 'report'

    src = nil
    if (file(:scheme)['scheme'].find{|r| r['id']==id} || {})['type'] == 'post'
      fname = KADAI[id, u, FILES[:log]]
      return nil unless File.exist?(fname)
      yaml = YAML.load_file(fname) rescue {}
      yaml = yaml['data'] || {}
      yaml = yaml.first if yaml.is_a?(Array)
      src = Report::Source::Post.new(yaml)
    else
      yaml = file(:data) rescue {}
      yaml = yaml['data'] || {}
      yaml = yaml.find{|x| x['login'] == u} || {}
      yaml = yaml['report'] || {}
      yaml = yaml[id] || {}
      src = Report::Source::Manual.new(yaml)
    end

    case type
    when 'solved'
      return Report::Solved.new(id, src, u)
    when 'record'
      return Report::Record.new(id, src, u)
    else
      return src
    end
  end
end
