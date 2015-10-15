# coding: utf-8
require 'test/unit'
require 'rr'

require 'app'

class AppTest < Test::Unit::TestCase
  DELAY = [ { 'label' => '遅れなし',
              'day' => 0},
            { 'label' => '提出遅れ',
              'day' => 3},
            { 'label' => '3日以上の遅れ',
              'otherwise' => true } ]

  DELAY_WITHOUT_OTHERWISE = [ { 'label' => '遅れなし',
                                'day' => 0},
                              { 'label' => '提出遅れ',
                                'day' => 3} ]

  SCHEME = { 'scheme' => [ { 'id' => 'report-for-test-use-only',
                             'type' => 'post',
                             'deadline' => { 'date' => '2000-01-01',
                                             'timezone' => '+09:00' }
                           },

                           { 'id' => 'report-for-test-use-only1',
                             'type' => 'post',
                             'deadline' => { 'date' => '2000-01-08',
                                             'time' => '00:00:00',
                                             'timezone' => '+09:00' }
                           },

                           { 'id' => 'report-for-test-use-only2',
                             'type' => 'post',
                             'deadline' => { 'date' => '2000-01-15',
                                             'time' => '10:30:00',
                                             'timezone' => '+09:00' }
                           },

                           { 'id' => 'report-for-test-use-only3',
                             'type' => 'post' }
                         ]
           }

  def setup

    @user = User.new(
              'login'     => 'user_id',
              'name'      => 'user_name',
              'ruby'      => 'user_ruby',
              'email'     => 'user@example.com',
              'assigned'  => 'assigned_TA'
            )

    @su = User.new(
            'login'     => 'suser_id',
            'name'      => 'suser_name',
            'ruby'      => 'suser_ruby',
            'email'     => 'suser@example.com',
            'assigned'  => 'sassigned_TA'
          )

    stub(User).all_users {
      [ @user, @su ]
    }

    $original_conf_initialize = Conf.allocate.method(:initialize)
    Conf.class_eval do
      define_method(:initialize) do
        @conf = {
          'master' => { 'su' => %w(suser_id),
                        'delay' => DELAY
                      },
          'scheme' => SCHEME
        }
      end
    end

    @report = [ 'report-for-test-use-only', 'report-for-test-use-only1',
                'report-for-test-use-only2', 'report-for-test-use-only3' ]
    @log_id = [ '2000-01-01T23:59:59+09:00', '2000-01-08T00:00:00+09:00',
                '2000-01-20T10:30:00+09:00', '2015-02-20T16:00:00+09:00' ]

    @dir = []
    @report.each do |r|
      @dir << Pathname(File.dirname(File.expand_path(__FILE__))) +
        "../db/kadai/#{r}/#{@user.login}"
    end

    @log = []
    @dir.each_index do |idx|
      FileUtils.mkdir_p(@dir[idx])
      @log << Log.new(@dir[idx] + 'log.yml')
      @log[idx].update(:data, @log_id[idx], 'status' => 'bad')
    end
  end

  def teardown
    Conf.class_eval do
      define_method(:initialize, $original_conf_initialize)
    end

    @dir.each do |dir|
      FileUtils.rm(dir + 'log.yml') if File.exist?(dir + 'log.yml')
      FileUtils.rm_r(dir) if File.exist?(dir)
      FileUtils.rm_r(dir + '..') if File.exist?(dir + '..')
    end
  end

  def test_no_user
    assert(App.new.user.nil?, 'App.new.user == nil')
  end

  def test_user
    assert_equal(@user, App.new(@user.login).user)
    assert_equal(@su,   App.new(@su.login).user)
  end

  def test_su?
    assert(!App.new.su?,              'App.new.su? == false')
    assert(!App.new(@user.login).su?, 'app.su? == false')
    assert(App.new(@su.login).su?,    'app.su? == true')
  end

  def test_visible_users
    assert(App.new.visible_users.nil?,
           'App.new.visible_users == nil')
    assert_equal([@user], App.new(@user.login).visible_users,
                 'visible users for normal users')
    assert_equal([@user, @su], App.new(@su.login).visible_users,
                 'visible users for super users')
  end

  def test_delay_options
    assert_equal(App.new.delay_options, ['遅れなし', '提出遅れ', '3日以上の遅れ'])
  end

  def test_report_delay
    def delay(user, report)
      App.new(user.login).report({ :status => 'record' }, report, @user).to_hash['delay']
    end

    delay_viewed_from = {}
    delay_viewed_from[:user] = []
    delay_viewed_from[:su] = []

    @report.each do |r|
      delay_viewed_from[:user] << delay(@user, r)
      delay_viewed_from[:su] << delay(@su, r)
    end

    # Only super users can view delay status.
    delay_viewed_from[:user].each {|d| assert_equal(d, '') }
    assert_equal(delay_viewed_from[:su][0], '遅れなし')
    assert_equal(delay_viewed_from[:su][1], '提出遅れ')
    assert_equal(delay_viewed_from[:su][2], '3日以上の遅れ')
    assert_equal(delay_viewed_from[:su][3], '') # Deadline is NOT specified.


    Conf.class_eval do
      define_method(:initialize) do
        @conf = {
          'master' => { 'su' => %w(suser_id) },
          'scheme' => SCHEME
        }
      end
    end

    delay_viewed_from[:user] = []
    delay_viewed_from[:su] = []
    @report.each do |r|
      delay_viewed_from[:user] << delay(@user, r)
      delay_viewed_from[:su] << delay(@su, r)
    end

    delay_viewed_from[:user].each {|d| assert_equal(d, '') }
    assert_equal(delay_viewed_from[:su][0], '遅れなし')
    assert_equal(delay_viewed_from[:su][1], '1秒')
    assert_equal(delay_viewed_from[:su][2], '5日と1秒')
    assert_equal(delay_viewed_from[:su][3], '') # Deadline is NOT specified.


    Conf.class_eval do
      define_method(:initialize) do
        @conf = {
          'master' => { 'su' => %w(suser_id),
                        'delay' => DELAY_WITHOUT_OTHERWISE
                      },
          'scheme' => SCHEME
        }
      end
    end

    delay_viewed_from[:user] = []
    delay_viewed_from[:su] = []
    @report.each do |r|
      delay_viewed_from[:user] << delay(@user, r)
      delay_viewed_from[:su] << delay(@su, r)
    end

    delay_viewed_from[:user].each {|d| assert_equal(d, '') }
    assert_equal(delay_viewed_from[:su][0], '遅れなし')
    assert_equal(delay_viewed_from[:su][1], '提出遅れ')
    assert_equal(delay_viewed_from[:su][2], '提出遅れ')
    assert_equal(delay_viewed_from[:su][3], '') # Deadline is NOT specified.


    Conf.class_eval do
      define_method(:initialize) do
        @conf = {
          'master' => { 'su' => %w(suser_id),
                        'delay' => DELAY
                      },
          'scheme' => SCHEME
        }
      end
    end

    @log[0].update(:data, @log_id[0], 'delay' => 'foo')
    @log[1].update(:data, @log_id[1], 'delay' => '3日以上の遅れ')

    delay_viewed_from[:user] = []
    delay_viewed_from[:su] = []
    delay_viewed_from[:user] << delay(@user, @report[0])
    delay_viewed_from[:user] << delay(@user, @report[1])
    delay_viewed_from[:su] << delay(@su, @report[0])
    delay_viewed_from[:su] << delay(@su, @report[1])

    delay_viewed_from[:user].each {|d| assert_equal(d, '') }
    assert_equal(delay_viewed_from[:su][0], '遅れなし')
    assert_equal(delay_viewed_from[:su][1], '3日以上の遅れ')

  end
end
