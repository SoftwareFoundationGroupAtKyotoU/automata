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

  def json_response(message)
    Response.new([json(message)], 200, json_header)
  end

  def json_header
    {
      'Content-Type' => @callback ? 'text/javascript' : 'application/json',
      'charset' => 'utf-8'
    }
  end

  def ok(message = nil, header = {})
    response(200, message, header)
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

  # @return [Hash{String => Object}] request parameters
  # @example
  #   # Values are String by default.
  #   param['a'] #=> '10' for the query "a=10"
  #   # Rack accepts multi-valued parameters such as "a[]=hoge".
  #   param['a'] #=> ['10', '20'] for the query "a[]=10&a[]=20"
  #   # TODO: write about files
  def params
    @req.params
  end

  # TODO: explain this method
  def optional(key)
    param = params[key].deep_copy
    def param.include?(x)
      if nil? || (is_a?(Array) && empty?)
        true
      elsif is_a?(Array)
        member?(x)
      else
        self == x
      end
    end
    param
  end

  private

  def json(data)
    data = data.to_json
    data = "#{@callback}(#{data});" if @callback
    return data
  end

  def response(status, message = nil, header = {})
    Response.new(message ? [message] : [], status, header)
  end
end
