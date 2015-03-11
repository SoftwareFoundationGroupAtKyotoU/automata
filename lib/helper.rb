require 'bundler/setup'

require 'rack'
require 'json'

class Helper
  include Rack

  STATUS = {
    303 => '303 See Other',
    400 => '400 Bad Request',
    403 => '403 Forbidden',
    404 => '404 Not Found',
    500 => '500 Internal Server Error'
  }

  def initialize(env)
    @env = env
    @req = Rack::Request.new(env)
    cb = (@req.params['callback'] || '').strip
    cb = nil if cb.length == 0 && cb !~ /^\$?[a-zA-Z0-9\.\_\[\]]+$/
    @callback = cb
  end

  # attr_reader :env

  def header
    ctype = @callback ? 'text/javascript' : 'application/json'
    return "Content-Type: #{ctype}; charset=utf-8\r\n\r\n"
  end

  def ok(message = nil)
    response(200, message)
  end

  def bad_request(message = nil)
    response(400, message)
  end

  def forbidden(message = nil)
    response(403, message)
  end

  def not_found(message = nil)
    response(404, message)
  end

  def internal_server_error(message = nil)
    response(500, message)
  end

  def redirect(location)
    Response.new { |r| r.redirect(location) }
  end

  # @return [Object] request parameters
  def params
    @req.params
  end

  # Rack accepts multi-valued parameters.
  # @example
  #   For the query "a[]=10&a[]=def", param['a'] = ['10', '20']
  def param(key)
    # cgi.rb may return StringIO as value, but Rack doesn't
    params[key.to_s]
  end

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

  private

  def response(status, message = nil)
    Response.new(message ? [message] : [], status)
  end
end
