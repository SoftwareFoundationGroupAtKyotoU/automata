require 'test/unit'

require 'pathname'
require 'syspath'
require 'user'

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
    user = User.new(
             'login'     => 'user id',
             'name'      => 'user name',
             'ruby'      => 'user ruby',
             'email'     => 'user@example.com',
             'assigned'  => 'assigned TA'
           )

    assert_equal(SysPath.user_dir('report_id', user),
                SysPath::KADAI + 'report_id' + user.real_login,
                'SysPath.user_dir')

    assert_equal(SysPath.user_log('report_id', user),
                SysPath.user_dir('report_id', user) + SysPath::FILES[:log],
                'SysPath.user_log')

    assert_equal(SysPath.user_post_dir('report_id', user, 'post_time'),
                SysPath.user_dir('report_id', user) + 'post_time',
                'SysPath.user_post_dir')

    assert_equal(SysPath.user_src_dir('report_id', user, 'post_time'),
                SysPath.user_post_dir('report_id', user, 'post_time') + 'src',
                'SysPath.user_src_dir')

    assert_equal(SysPath.comment_dir('report_id', user),
                SysPath.user_dir('report_id', user) + 'comment',
                'SysPath.comment_dir')
  end
end
