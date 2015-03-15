# -*- coding: utf-8 -*-

require 'test/unit'
require 'rr'
require 'rack/test'

require 'pp'

require 'api/admin_log'

class AdminLogTest < Test::Unit::TestCase
  include Rack::Test::Methods

  def setup
    $original_conf_initialize = Conf.allocate.method(:initialize)
    Conf.class_eval do
      define_method(:initialize) do
        @conf = {
          'master' => { 'su' => %w(user0) }
        }
      end
    end

    @user = 'user-for-test-use-only'
    @report = 'report-for-test-use-only'
    @log_id = %w(2000-01-01T16:00:00+09:00 2000-01-01T17:00:00+09:00)

    @dir = Pathname(File.dirname(File.expand_path(__FILE__))) +
           "../../db/kadai/#{@report}/#{@user}"
    FileUtils.mkdir_p(@dir)
    @log = Log.new(@dir + 'log.yml')
    @log.transaction do |log|
      log.update(:data, @log_id[0], 'status' => 'bad')
      log.update(:data, @log_id[1], 'status' => 'bad')
    end
  end

  def teardown
    Conf.class_eval do
      define_method(:initialize, $original_conf_initialize)
    end

    FileUtils.rm(@dir + 'log.yml') if File.exist?(@dir + 'log.yml')
    FileUtils.rm_r(@dir) if File.exist?(@dir)
    FileUtils.rm_r(@dir + '..') if File.exist?(@dir + '..')
  end

  def app
    API::AdminLog.new
  end

  def test_query_parameters
    any_instance_of(App) do |klass|
      stub(klass).users do
        [
          User.new(
            'login' => 'user0',
            'name'  => 'user name0',
            'ruby'  => 'user ruby0',
            'email' => 'a0@b.c'
          ),
          User.new(
            'login' => 'user1',
            'name'  => 'user name1',
            'ruby'  => 'user ruby1',
            'email' => 'a1@b.c'
          )
        ]
      end
    end

    get '/'
    assert last_response.forbidden?

    rack_env = { 'REMOTE_USER' => 'user0' }

    get '/', {}, rack_env
    assert last_response.bad_request?

    get '/', { 'user' => 'not_exist_user' }, rack_env
    assert last_response.bad_request?

    get '/', { 'user' => 'user0' }, rack_env
    assert last_response.bad_request?

    get '/',
        { 'user' => 'user0', 'report' => @report, 'id' => 'id0' },
        rack_env
    assert last_response.ok?

    get '/',
        { 'user' => User.make_token('user1'), 'report' => @report,
          'id' => 'id0' },
        rack_env
    assert last_response.ok?
  end

  def test_log_update
    any_instance_of(App) do |klass|
      stub(klass).users do
        [
          User.new(
            'login' => @user,
            'name'  => 'user name0',
            'ruby'  => 'user ruby0',
            'email' => 'a0@b.c'
          )
        ]
      end
    end

    # log id must be latest
    get '/',
        { 'user' => @user, 'report' => @report, 'id' => @log_id[0],
          'status' => 'ok' },
        'REMOTE_USER' => 'user0'
    assert last_response.bad_request?

    get '/',
        { 'user' => @user, 'report' => @report, 'id' => @log_id[1],
          'status' => 'good' },
        'REMOTE_USER' => 'user0'
    assert last_response.ok?

    @log.transaction do |log|
      assert_equal log.retrieve(:data, @log_id[0])['status'], 'bad'
    end
    @log.transaction do |log|
      assert_equal log.retrieve(:data, @log_id[1])['status'], 'good'
    end

    # change all data
    get '/',
        { 'user' => @user, 'report' => @report, 'id' => @log_id[1],
          'status' => 'status', 'message' => 'message', 'error' => 'error',
          'reason' => 'reason' },
        'REMOTE_USER' => 'user0'
    assert last_response.ok?
    @log.transaction do |log|
      d = log.retrieve(:data, @log_id[1])
      assert_equal d['status'], 'status'
      assert_equal d['log']['message'], 'message'
      assert_equal d['log']['error'], 'error'
      assert_equal d['log']['reason'], 'reason'
    end

    # change except status
    get '/',
        { 'user' => @user, 'report' => @report, 'id' => @log_id[1],
          'message' => 'message1', 'error' => 'error1', 'reason' => 'reason1' },
        'REMOTE_USER' => 'user0'
    assert last_response.ok?
    @log.transaction do |log|
      d = log.retrieve(:data, @log_id[1])
      assert_equal d['status'], 'status'
      assert_equal d['log']['message'], 'message1'
      assert_equal d['log']['error'], 'error1'
      assert_equal d['log']['reason'], 'reason1'
    end
  end
end
