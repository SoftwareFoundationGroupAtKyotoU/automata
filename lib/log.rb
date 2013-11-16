require 'store'
require 'time'

class Log < Store::YAML
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

  def size()
    transaction do
      return 0 if @store.roots.empty?
      return @store.roots.map{|r| (@store[r]||[]).size}.max
    end
  end

  def pop()
    popped_id = nil
    transaction do
      root = @store.roots.min_by{|r| oldest_id(r)}
      if root
        popped_id = oldest_id(root)
        @store.roots.each do |r|
          @store[r] = (@store[r]||[]).reject{|x| x['id'] == popped_id }
        end
      end
    end
    return popped_id
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

  def oldest_id(root)
    return ((@store[root]||[]).last||{})['id'] || ''
  end
end
