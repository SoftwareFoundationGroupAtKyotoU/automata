require 'test/unit'

require 'log'

class LogTest < Test::Unit::TestCase
  def setup()
    @file = "./tmp.log"
    @log = Log.new(@file)
    @root = :data
  end

  def teardown()
    File.delete(@file) if File.exists?(@file)
  end

  def test_size()
    assert_equal(0, @log.size())
  end

  def test_add()
    assert_equal(0, @log.size())
    @log.add(@root, { 'key' => 'value' })
    assert_equal(1, @log.size())
  end

  def test_latest()
    @log.add(@root, { 'key' => 'first' })
    @log.add(@root, { 'key' => 'second' })

    latest = @log.latest(@root)
    assert_equal('second', latest['key'])
  end

  def test_pop()
    id1 = Time.now
    @log.write(@root, id1, { 'key' => 'first' })
    id2 = id1 + 10
    @log.write(@root, id2, { 'key' => 'second' })

    assert_not_equal(id1, id2)

    assert_equal(2, @log.size())
    assert_equal(id1.iso8601, @log.pop())
    assert_equal(1, @log.size())
    assert_equal(id2.iso8601, @log.pop())
    assert_equal(0, @log.size())
  end

  def test_retrieve()
    id1 = Time.now
    @log.write(@root, id1, { 'key' => 'first' })
    id2 = id1 + 10
    @log.write(@root, id2, { 'key' => 'second' })
    id3 = id2 + 10

    assert_not_equal(id1, id2)
    assert_not_equal(id2, id3)

    assert_equal('first', @log.retrieve(@root, id1)['key'])
    assert_equal('second', @log.retrieve(@root, id2)['key'])

    # not exists
    assert_equal({}, @log.retrieve(@root, id3))
  end

  def test_update()
    id = Time.now.iso8601
    @log.write(@root, id, { 'key' => 'value' })

    assert_equal('value', @log.retrieve(@root, id)['key'])

    @log.update(@root, id, { 'key' => 'updated' })
    assert_equal('updated', @log.latest(@root)['key'])
    # Only 'timestamp' is updated, 'id' isn't.
    assert_equal('updated', @log.retrieve(@root, id)['key'])
  end
end
