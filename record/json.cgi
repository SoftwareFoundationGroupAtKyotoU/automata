#! /usr/bin/env ruby
$KCODE='UTF8'

require 'rubygems'
require 'json'
require 'cgi'
require 'yaml'
require 'time'
cgi = CGI.new

files = {
  :master => '../config.yml',
  :local  => '../local.yml',
  :scheme => 'scheme.yml',
  :data   => '../data.yml',
}

cb = (cgi.params['callback'][0] || '').strip
cb = nil if cb.length == 0 && cb !~ /^\$?[a-zA-Z0-9\.\_\[\]]+$/

unless cb
  print("Content-Type: application/json; charset=utf-8\r\n\r\n")
else
  # JSONP
  print("Content-Type: text/javascript; charset=utf-8\r\n\r\n")
end

class Exercise
  attr_reader :major, :minor
  def initialize(ex)
    if ex =~ /^\s*((?:Ex)[0-9.]+)(\([0-9]+\))?\s*$/
      @major = $1
      @minor = $2
    end
    @major ||= ''
    @minor ||= ''
  end

  def to_s() return @major+@minor end
end

class Counter
  attr_reader :overflow

  def initialize(report)
    @report = Marshal.load(Marshal.dump((report || {}))) # deep copy
    @overflow = []
  end

  def vote(ex)
    r = @report[ex.to_s] || @report[ex.major]
    if r
      if (r['need']||0) > 0
        r['need'] = r['need'] - 1
      else
        @overflow << ex.to_s
      end
    else
      @overflow << ex.to_s
    end
  end

  def insufficient()
    insuf = []
    @report.each do |ex, val|
      insuf << [ex, val['need']] if (val['need']||0) > 0
    end
    return insuf
  end
end

class Conf
  attr_reader :report

  def initialize(master, data)
    @su = master['su']
    @report = data['report']
  end

  def su?(user) return @su.include?(user) end
end

class User
  def initialize(user, conf)
    @user = user
    @conf = conf
    @counter = nil
  end

  def number() return @user['number'] end
  def login() return @user['login'] end
  def name() return @user['name'] end
  def ruby() return @user['ruby'] end
  def report() return (@user['report']||{}).keys end
  def submit?(k) return @user['report'][k] end

  def unsolved(k)
    return [] unless submit?(k)
    return counter(k).insufficient
  end

  def optional(k)
    return [] unless submit?(k)
    return counter(k).overflow
  end

  def to_hash()
    hash = {
      'number'   => number,
      'login'    => login,
      'name'     => name,
      'report'   => {},
    }
    report.each do |k|
      hash['report'][k] = {
        'status'   => !!submit?(k),
        'unsolved' => unsolved(k),
        'optional' => optional(k),
      }
    end
    return hash
  end

  private

  def counter(k)
    unless @counter
      @counter = Counter.new(@conf.report[k])
      submit?(k).each do |ex|
        @counter.vote(Exercise.new(ex))
      end
    end
    return @counter
  end
end

yml = {}
files.each do |name, file|
  yml[name] = YAML.load_file(file) rescue yml[name] = {}
end
config = Conf.new(yml[:master], yml[:scheme])
record = {
  'year'      => yml[:master]['year'],
  'scheme'    => yml[:scheme]['scheme'],
  'data'      => [],
}
if File.exist?(files[:data])
  record['timestamp'] = File.mtime(files[:data]).iso8601
end

user = cgi.remote_user || yml[:local]['user']

data = yml[:data]
data['data'] ||= {}
data['data'] = data['data'].map{|u| User.new(u, config)}
data['data'].reject!{|u| u.login != user} unless config.su?(user)
data['data'].each{|u| record['data'] << u.to_hash}

json = record.to_json
json = "#{cb}(#{json});" if cb

puts(json)
