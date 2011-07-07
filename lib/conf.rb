class App
  class Conf
    def initialize(master, local)
      @hash = master.merge(local)
    end

    def [](*keys) return keys.inject(@hash){|r,x| r[x.to_s]} end
    def []=(key, val) @hash[key.to_s]=val; return self end
    def to_hash() return @hash end
  end
end
