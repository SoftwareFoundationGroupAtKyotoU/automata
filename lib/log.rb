require 'yaml'
require 'time'

class Log
  def initialize(file, time)
    @file = file
    @time = time
    @log = YAML.load_file(file)||{} rescue {}
    @log['data'] ||= []
    @log['build'] ||= []
    yield(self) if block_given?
  end

  def get(what)
    return @log[what].find{|x| (x['id']||x['timestamp']) == @time.iso8601}
  end

  def put(what, entry)
    hash = get(what)
    if hash
      hash.merge!(entry)
    else
      @log[what].unshift(entry)
    end
  end

  def data() return get('data')||{} end

  def data!(entry)
    entry = {
      'id'        => data['id'] || @time.iso8601,
      'timestamp' => @time.iso8601,
    }.merge(entry)
    put('data', entry)
  end

  def build() return get('build')||{} end
  def build!(entry) put('build', entry) end

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
end
