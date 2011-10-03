require 'pstore'
require 'yaml/store'

class Store
  def initialize(file, readonly=false)
    @file = file.to_s
    @store = nil
    @readonly = readonly
  end

  def store_class() return PStore end

  def path() return @file end

  def ro() return self.class.new(@file, true) end

  def transaction(readonly=nil, &block)
    return block.call(self) if @store

    begin
      @store = store_class.new(@file)
      @store.transaction((readonly==nil && @readonly) || readonly) do
        block.call(self)
      end
    ensure
      @store = nil
    end
  end

  def [](*keys)
    transaction do
      return keys.inject(@store){|r,x| (r||{})[x.to_s]}
    end
  end

  def []=(key, val)
    transaction do
      @store[key.to_s] = val
      return self
    end
  end

  class YAML < Store
    def store_class() return ::YAML::Store end
  end
end
