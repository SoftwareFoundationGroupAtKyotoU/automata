require 'yaml'
require 'time'

class Log
  def initialize(file, time)
    @file = file
    @time = time
    @log = YAML.load_file(file) rescue { 'data' => [], 'build' => [] }
    yield(self) if block_given?
  end

  def get(what)
    return @log[what].find{|x| (x['id']||x['timestamp']) == @time.iso8601}
  end

  def update(entry)
    hash = get('data')
    if hash
      hash.merge!(entry)
    else
      @log['data'].unshift(entry)
    end
  end

  def data() return get('data')||{} end
  def build() return get('build')||{} end

  def write(hash)
    hash = {
      'id'        => data['id'] || @time.iso8601,
      'timestamp' => @time.iso8601,
    }.merge(hash)
    update(hash)

    open(@file, 'w'){|io| YAML.dump(@log, io)}
  end
end
