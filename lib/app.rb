require 'cgi'
require 'yaml'
require 'time'
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

  BASE   = Location.new($base_dir || '..')
  CONFIG = BASE + 'config'
  DB     = BASE + 'db'
  KADAI  = DB + 'kadai'
  BUILD  = BASE + 'test'
  SCRIPT = BASE + 'script'

  FILES = {
    :master      => CONFIG['master.yml'],
    :local       => CONFIG['local.yml'],
    :scheme      => CONFIG['scheme.yml'],
    :template    => CONFIG['template.yml'],
    :data        => DB['data.yml'],
    :log         => 'log.yml',
    :build       => BUILD['build.rb'],
    :sandbox     => BUILD['test.rb'],
    :test_script => SCRIPT['test'],
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
      @conf = Conf.new(file(:master), (file(:local) rescue nil))
    end
    return @conf
  end

  def template()
    unless @template
      require 'conf'
      @template = Conf.new(file(:template), (file(:local) rescue nil))
    end
    return @template
  end

  def user(u=nil)
    @user = u || conf[:user] || cgi.remote_user unless @user
    return @user
  end

  def su?(u=nil) return conf[:su].include?(u||user) end

  def user_dir(r) return KADAI + r + user end

  def users()
    unless @users
      require 'user'
      @users = file(:data)['data'].map{|u| User.new(u)}
      @users.reject!{|u| u.login != user} unless conf[:record, :open] || su?
      unless conf[:record, :show_login]
        # override User#login to hide user login name
        @users.each{|u| def u.login() return token end}
      end
    end
    return @users
  end

  def report(option, id, u)
    require 'report'

    status = option[:status]
    log = option[:log]

    src = nil
    optional = []
    optional << :log if option[:log]
    optional << :detail if option[:log] && (conf[:record, :detail] || su?)

    if (file(:scheme)['scheme'].find{|r| r['id']==id} || {})['type'] == 'post'
      fname = KADAI[id, u, FILES[:log]]
      return nil unless File.exist?(fname)
      yaml = YAML.load_file(fname)||{} rescue {}
      yaml = yaml['data'] || {}
      yaml = yaml.first if yaml.is_a?(Array)
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
      scheme = (file(:scheme)['report'] || {})[id] || {}
      return Report::Record.new(src, scheme)
    else
      return src
    end
  end
end
