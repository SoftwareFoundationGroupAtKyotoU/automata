require 'yaml'
require 'time'

class Log
  def initialize(file, time=Time.now)
    @file = file
    @time = time
    @log = YAML.load_file(file)||{} rescue {}
    @log['data'] ||= []
    @log['build'] ||= []
    yield(self) if block_given?
  end

  def get_time(x) return x['id'] || x['timestamp'] end

  def latest(what)
    return @log[what.to_s].sort{|a,b| get_time(a) <=> get_time(b)}.last
  end

  def get(what)
    return @log[what.to_s].find{|x| get_time(x) == @time.iso8601}
  end

  def put(what, entry)
    hash = get(what)
    if hash
      hash.merge!(entry)
    else
      @log[what.to_s].unshift(entry)
    end
  end

  def data() return get(:data)||{} end

  def data!(entry)
    entry = {
      'id'        => data['id'] || @time.iso8601,
      'timestamp' => @time.iso8601,
    }.merge(entry)
    put(:data, entry)
  end

  def build() return get(:build)||{} end
  def build!(entry) put(:build, entry) end

  def write(args)
    args.each{|k,v| self.send(k.to_s+'!', v)}

    open(@file, 'w') do |io|
      io.flock(File::LOCK_EX)
      YAML.dump(@log, io)
      io.flock(File::LOCK_UN)
    end
  end

  def write_data(val) write(:data => val) end
  def write_build(val) write(:build => val) end
  def update_data(val)
    val['timestamp'] = Time.now.iso8601
    write_data(val)
  end
end
