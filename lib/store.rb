require 'pstore'
require 'yaml/store'

class Store
  def initialize(path, readonly=false)
    @path = path.to_s
    @store = nil
    @readonly = readonly
  end

  attr_reader :path

  def store_class() PStore end

  def ro() self.class.new(@path, true) end

  # If the argument 'readonly' is false, the transaction is always writable
  # regardless whether @readonly is 'set to true' or not.
  def transaction(readonly=nil, &block)
    return block.call(self) if @store

    begin
      @store = store_class.new(@path, true)
      @store.transaction((readonly.nil? && @readonly) || readonly) do
        block.call(self)
      end
    ensure
      @store = nil
    end
  end

  def [](*keys)
    transaction do
      keys.inject(@store){|r,x| (r||{})[x.to_s]}
    end
  end

  def []=(key, val)
    transaction do
      @store[key.to_s] = val
    end
    self
  end

  class YAML < Store
    def store_class() ::YAML::Store end
  end
end
