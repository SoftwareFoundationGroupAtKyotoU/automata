require 'yaml/store'
require 'time'

class Log
  def initialize(file, readonly=false)
    @file = file.to_s
    @store = nil
    @readonly = readonly
  end

  def transaction(readonly=nil, &block)
    return block.call(self) if @store

    begin
      @store = YAML::Store.new(@file)
      @store.transaction((readonly==nil && @readonly) || readonly) do
        block.call(self)
      end
    ensure
      @store = nil
    end
  end

  def ro() return self.class.new(@file, true) end

  def latest(root)
    transaction do
      return (@store[root.to_s]||[]).sort{|a,b| a['id'] <=> b['id']}.last || {}
    end
  end

  def retrieve(root, id)
    id = id.iso8601 if id.is_a?(Time)
    transaction do
      return get(root, id) || {}
    end
  end

  def write(root, id, val)
    id = id.iso8601 if id.is_a?(Time)
    transaction{ self.send(root.to_s+'!', id, val) }
  end

  def add(root, val)
    write(root, Time.now.iso8601, val)
  end

  def update(root, id, val)
    val['timestamp'] = Time.now.iso8601
    write(root, id, val)
  end

  private

  def get(root, id)
    return (@store[root.to_s]||[]).find{|x| x['id'] == id}
  end

  def put(root, id, val)
    current = get(root, id)
    if current
      current.merge!(val)
    else
      @store[root.to_s] = [] unless @store[root.to_s]
      @store[root.to_s].unshift(val)
    end
  end

  def data!(id, val)
    val = {
      'id'        => id,
      'timestamp' => id,
    }.merge(val)
    put(:data, id, val)
  end

  def build!(id, val)
    put(:build, id, val)
  end
end
