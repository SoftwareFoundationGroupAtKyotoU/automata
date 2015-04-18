require 'test/unit'

require 'pathname'
require 'syspath'

class SysPahtTest < Test::Unit::TestCase
  def test_constnats
    assert(SysPath::DB.is_a?(Pathname),     'SysPath::DB is a Pathname')
    assert(SysPath::KADAI.is_a?(Pathname),  'SysPath::KADAI is a Pathname')
    assert(SysPath::BUILD.is_a?(Pathname),  'SysPath::BUILD is a Pathname')
    assert(SysPath::SCRIPT.is_a?(Pathname), 'SysPath::SCRIPT is a Pathname')
    assert(SysPath::BACKUP.is_a?(Pathname), 'SysPath::BACKUP is a Pathname')

    [
     :data,
     :build,
     :sandbox,
     :test_script,
     :interact_script
    ].each do |k|
      assert(SysPath::FILES[k].is_a?(Pathname), "SysPath::FILES[:#{k.to_s}] is a Pathname")
    end

    assert(SysPath::FILES[:log].is_a?(String), 'SysPath::FILES[:log] is a String')
  end

  def test_dir
    assert_equal(SysPath::user_dir('report_id', 'user_name'),
                SysPath::KADAI + 'report_id' + 'user_name',
                'SysPath::user_dir')

    assert_equal(SysPath::user_log('report_id', 'user_name'),
                SysPath::user_dir('report_id', 'user_name') + SysPath::FILES[:log],
                'SysPath::log')

    assert_equal(SysPath::user_post_dir('report_id', 'user_name', 'post_time'),
                SysPath::user_dir('report_id', 'user_name') + 'post_time',
                'SysPath::user_post_dir')

    assert_equal(SysPath::user_src_dir('report_id', 'user_name', 'post_time'),
                SysPath::user_post_dir('report_id', 'user_name', 'post_time') + 'src',
                'SysPath::user_src_dir')

    assert_equal(SysPath::comment_dir('report_id', 'user_name'),
                SysPath::user_dir('report_id', 'user_name') + 'comment',
                'SysPath::comment_dir')
  end
end
