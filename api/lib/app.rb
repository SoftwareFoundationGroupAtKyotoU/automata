require 'cgi'
require 'yaml'
require 'clone'

require 'rubygems'
require 'json'

class App
  class Location
    BASE = '..'
    def initialize(*dirs)
      @dirs = [BASE] + dirs
    end

    def [](*path)
      path = @dirs+path
      return File.join(*path)
    end
  end

  CONFIG = Location.new('config')
  DB = Location.new('db')

  FILES = {
    :master => CONFIG['config.yml'],
    :local  => CONFIG['local.yml'],
    :scheme => CONFIG['scheme.yml'],
    :data   => DB['data.yml'],
    :log    => DB['kadai', 'log.yml'],
  }

  def initialize()
    @cgi = CGI.new
    cb = (@cgi.params['callback'][0] || '').strip
    cb = nil if cb.length == 0 && cb !~ /^\$?[a-zA-Z0-9\.\_\[\]]+$/
    @callback = cb
  end

  def header()
    ctype = @callback ? 'text/javascript' : 'application/json'
    return "Content-Type: #{ctype}; charset=utf-8\r\n\r\n"
  end

  def file(name)
    return YAML.load_file(FILES[name])
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
end
