# coding: utf-8

require 'pathname'

module SysPath
  base_dir = ::Pathname.new(::File.dirname(::File.expand_path(__FILE__))) + '..'
  DB     = base_dir + 'db'
  KADAI  = DB + 'kadai'
  BUILD  = base_dir + 'build'
  SCRIPT = base_dir + 'script'
  BACKUP = DB + 'backup'

  FILES = {
    data:            DB + 'data.yml',
    log:             'log.yml',
    build:           SCRIPT + 'build.rb',
    sandbox:         SCRIPT + 'test.rb',
    test_script:     SCRIPT + 'test',
    interact_script: SCRIPT + 'interact'
  }

  # Returns a path to an user directory
  # @param [String] report_id report name
  # @param [User] user user id
  # TODO
  def self.user_dir(report_id, user)
    KADAI + report_id + user.real_login
  end

  # Returns a path to a log file for a user
  # @param [String] report_id report name
  # @param [String] user user id
  def self.user_log(report_id, user)
    user_dir(report_id, user) + FILES[:log]
  end

  # Returns a path to a directory where submitted files are saved
  # @param [String] report_id report name
  # @param [String] user user id
  # @param [String] time time id for a submission
  def self.user_post_dir(report_id, user, time)
    user_dir(report_id, user) + time
  end

  # Returns a path to a src directory where submitted files are saved
  # @param [String] report_id report name
  # @param [String] user user id
  # @param [String] time time id for a submission
  def self.user_src_dir(report_id, user, time)
    user_post_dir(report_id, user, time) + 'src'
  end

  # Returns a path to a comment directory where comments are saved
  # @param [String] report_id report name
  # @param [String] user user id
  def self.comment_dir(report_id, user)
    user_dir(report_id, user) + 'comment'
  end
end
