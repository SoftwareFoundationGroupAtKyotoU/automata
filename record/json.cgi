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
  :kadai  => '../kadai',
  :log    => 'log.yml',
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

  def to_a()
    arr = []
    arr = $1.split('.').map{|x|x.to_i} if @major =~ /^Ex([0-9.]+)$/
    arr.push($1.to_i) if @minor =~ /^\(([0-9]+)\)$/
    return arr
  end

  def <=>(other)
    return to_a <=> other.to_a
  end

  def to_s() return @major+@minor end
end

class Counter
  attr_reader :overflow

  def initialize(report)
    @report = Marshal.load(Marshal.dump((report || {}))) # deep copy
    @overflow = {}
  end

  def vote(ex)
    r = @report[ex.to_s] || @report[ex.major]
    if r
      if (r['required']||0) > 0
        r['required'] = r['required'] - 1
      else
        add_overflow(r, ex)
      end
    else
      add_overflow({}, ex)
    end
  end

  def insufficient()
    insuf = []
    @report.each do |ex, val|
      insuf << [ex, val['required']] if (val['required']||0) > 0
    end
    return insuf.sort{|a,b| Exercise.new(a[0]) <=> Exercise.new(b[0])}
  end

  private

  def add_overflow(scheme, ex)
    level = (scheme['level']||'').to_s
    @overflow[level] = [] unless @overflow[level]
    @overflow[level] << ex.to_s
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
    @log = {}
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

  def add_log(report_id, data)
    @log[report_id] = data
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
      }
      optional(k).each do |level, solved|
        hash['report'][k]['optional'+level] = solved
      end
    end

    @log.each do |k, data|
      counter = make_counter(k, data['report'])
      hash['report'][k] = {
        'status'    => data['status'],
        'timestamp' => data['timestamp'],
        'unsolved'  => counter.insufficient,
      }
      counter.overflow.each do |level, solved|
        hash['report'][k]['optional'+level] = solved
      end
    end

    return hash
  end

  private

  def make_counter(k, data=nil)
    counter = Counter.new(@conf.report[k])
    (data||[]).each do |ex|
      counter.vote(Exercise.new(ex))
    end
    return counter
  end

  def counter(k)
    @counter = make_counter(k, submit?(k)) unless @counter
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

#### reports in record/data.yml

data = yml[:data]
data['data'] ||= {}
users = data['data'].map{|u| User.new(u, config)}
users.reject!{|u| u.login != user} unless config.su?(user)

#### reports in kadai/log.yml

scheme = yml[:scheme]['scheme']
scheme.each do |report|
  users.each do |u|
    user = {}
    user[:log] = File.join(files[:kadai], report['id'], u.login, files[:log])
    if File.exist?(user[:log])
      user[:data] = YAML.load_file(user[:log]) rescue user[:data] = {}
      user[:data] = user[:data]['data'] || {}
      user[:data] = user[:data].first if user[:data].is_a?(Array)
      u.add_log(report['id'], user[:data])
    end
  end
end

#### write out

users.each{|u| record['data'] << u.to_hash}
json = record.to_json
json = "#{cb}(#{json});" if cb

puts(json)
