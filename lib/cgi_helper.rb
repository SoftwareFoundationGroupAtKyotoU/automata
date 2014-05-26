require 'rubygems'
require 'bundler/setup'

require 'cgi'
require 'json'

class CGIHelper
  STATUS = {
    400 => '400 Bad Request',
    403 => '403 Forbidden',
    404 => '404 Not Found',
    500 => '500 Internal Server Error'
  }

  def initialize()
    @cgi = CGI.new
    cb = (@cgi.params['callback'][0] || '').strip
    cb = nil if cb.length == 0 && cb !~ /^\$?[a-zA-Z0-9\.\_\[\]]+$/
    @callback = cb
  end

  attr_reader :cgi

  def header()
    ctype = @callback ? 'text/javascript' : 'application/json'
    return "Content-Type: #{ctype}; charset=utf-8\r\n\r\n"
  end

  def exit_with_bad_request(message=nil)
    error_exit(STATUS[400], message)
  end

  def exit_with_forbidden(message=nil)
    error_exit(STATUS[403], message)
  end

  def exit_with_not_found(message=nil)
    error_exit(STATUS[404], message)
  end

  def exit_with_internal_server_error(message=nil)
    error_exit(STATUS[500], message)
  end

  def params() return @cgi.params end

  def param(key)
    val = params[key.to_s]
    return nil if val.empty?
    val = val[0]
    val = val.read if val.respond_to?(:read)
    return val
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

  def error_exit(status, message=nil)
    print(cgi.header('type' => 'text/plain', 'status' => status))
    puts(message ? message : status)
    exit
  end
end
