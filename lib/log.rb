require_relative 'store'
require 'time'

class Log < Store::YAML
  # Return the latest record of the given root
  # @param [Symbol] root the kind of the record
  # @return [Hash] the latest record of the given root, or the empty hash if the record is not found
  def latest(root)
    transaction do
      return (@store[root.to_s]||[]).sort{|a,b| a['id'] <=> b['id']}.last || {}
    end
  end

  # Return the oldest record of the given root
  # @param [Symbol] root the kind of the record
  # @return [Hash] the oldest record of the given root, or the empty hash if the record is not found
  def oldest(root)
    transaction do
      return (@store[root.to_s]||[]).sort{|a,b| b['id'] <=> a['id']}.last || {}
    end
  end

  # Return the record which has the given root and id
  # @param [Symbol] root the kind of the record
  # @param [Time, String] id the time when the record is created
  # @return [Hash] the record which has the given root and id, or the empty hash if the record is not found
  def retrieve(root, id)
    id = id.iso8601 if id.is_a?(Time)
    transaction do
      return get(root, id) || {}
    end
  end

  # Add a record to the log
  # @param [Symbol] root the kind of the record
  # @param [Time, String] id the time when the record is created
  # @param [Hash] val the record added in the log
  def write(root, id, val)
    id = id.iso8601 if id.is_a?(Time)
    transaction{ self.send(root.to_s+'!', id, val) }
  end

  # Add a record to the log
  # @param [Symbol] root the kind of the log
  # @param [Hash] val the record added in the log
  def add(root, val)
    write(root, Time.now.iso8601, val)
  end

  # Update the log with the given val
  # @param [Symbol] root the kind of the record
  # @param [Time, String] id the time when the record is created
  # @param [Hash] val the new record
  def update(root, id, val)
    val['timestamp'] = Time.now.iso8601
    write(root, id, val)
  end

  # Return the number of the kind which has the largest number of records
  # @return [Integer] the number of the kind which has the largest number of records
  def size()
    transaction do
      return 0 if @store.roots.empty?
      return @store.roots.map{|r| (@store[r]||[]).size}.max
    end
  end

  # Delete the oldest record from the log
  # @return [String] the id of the oldest record, or nil if the record is not found
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

  # Return the record which has the given root and id
  # @param [Symbol] root the kind of the record
  # @param [Time, String] id the time when the record is created
  # @return [Hash] the record which has the given root and id, or the empty hash if the record is not found
  def get(root, id)
    return (@store[root.to_s]||[]).find{|x| x['id'] == id}
  end

  # Put a record into the head of the list of records of the given root
  # @param [Symbol] root the kind of the record
  # @param [Time, String] id the time when the record is created
  # @param [Hash] val the put record
  def put(root, id, val)
    current = get(root, id)
    if current
      current.merge!(val)
    else
      @store[root.to_s] = [] unless @store[root.to_s]
      @store[root.to_s].unshift(val)
    end
  end

  # Store a record of posted exercise
  # @param [Time, String] id the time when the record is created
  # @param [Hash] val the record about the posted exericises
  def data!(id, val)
    val = {
      'id'        => id,
      'timestamp' => id,
    }.merge(val)
    put(:data, id, val)
  end

  # Store a result of a build
  # @param [Time, String] id the time when the record is created
  # @param [Hash] val the result of the bulid
  def build!(id, val)
    put(:build, id, val)
  end

  # Return the id of the oldest record of the given root
  # @param [Symbol] root the type of the record
  # @return [String] the id of the oldest record of the given root, or the empty string if the record is not found
  def oldest_id(root)
    return ((@store[root]||[]).last||{})['id'] || ''
  end
end
