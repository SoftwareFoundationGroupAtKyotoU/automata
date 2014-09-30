require 'pstore'
require 'test/unit'
require 'tempfile'

require 'store'
require 'log'

# TODO: Write tests for #[] and #[]=
class StoreTest < Test::Unit::TestCase
  def setup
    @file = Tempfile.new('store')
    @path = @file.path
    @klasses = [Store, Store::YAML, Log]
  end

  def teardown
    @file.close
    @file.unlink
  end

  def test_path
    @klasses.each {|klass| _test_path(klass) }
  end

  def _test_path(klass)
    store = klass.new(@path)
    assert_equal(@path.to_s, store.path())
  end

  def test_read_write
    @klasses.each do |klass|
      _test_read_write(klass)
      File.truncate(@path, 0)
    end
  end

  def _test_read_write(klass)
    store = klass.new(@path)
    key, value = 'key', 'value'
    store.ro.transaction{|store| assert_nil(store[key])}

    store.transaction{|store| store[key] = value}
    store.transaction{|store| assert_equal(value, store[key])}
    store.ro.transaction do |store|
      assert_raise(PStore::Error) { store[key] = 'another value' }
    end
  end

  def test_read_only
    @klasses.each do |klass|
      _test_read_only(klass)
      File.truncate(@path, 0)
    end
  end

  def _test_read_only(klass)
    store = klass.new(@path)
    key, value = 'key', 'value'
    store.transaction{|store| store[key] = value }

    # Cannot rewrite the value in read-only transaction
    store.transaction(true) do |store|
      assert_raise(PStore::Error) { store[key] = 'another value' }
    end

    readonly_store = klass.new(@path, true)
    readonly_store.transaction{|store| assert_equal(value, readonly_store[key])}
    readonly_store.ro.transaction{|store| assert_equal(value, readonly_store[key])}
    # Cannot rewrite the value by readonly store.
    readonly_store.transaction do |store|
      assert_raise(PStore::Error) { readonly_store[key] = 'another value' }
    end
    readonly_store.ro.transaction do |store|
      assert_raise(PStore::Error) { readonly_store[key] = 'another value' }
    end
  end

  def test_transaction
    @klasses.each do |klass|
      _test_transaction(klass)
      File.truncate(@path, 0)
    end
  end

  def _test_transaction(klass)
    store = klass.new(@path)
    key, value = 'key', 'value'
    store.transaction{|store| store[key] = value }
    store.ro.transaction{|store| assert_equal(value, store[key])}

    readonly_store = klass.new(@path, true)
    readonly_store.transaction do |store|
      assert_raise(PStore::Error) { readonly_store[key] = 'another value' }
    end
    readonly_store.transaction(false) do |store|
      readonly_store[key] = 'another value'
      assert_equal('another value', readonly_store[key])
    end
  end
end
