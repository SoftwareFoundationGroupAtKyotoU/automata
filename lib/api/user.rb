# -*- coding: utf-8 -*-

require_relative '../app'
require_relative '../helper'

module API
  # Usage: user [user=<login>] [type={info|status}]
  #             [status={solved|record}] [log] [report=<report-id>]
  #             [filter=<assigned_TA>]
  #   ユーザごとの情報を表示
  # Options:
  #   user           ログイン名が<login>のユーザの情報のみ取得
  #   type   info    ユーザ情報のみ取得(デフォルト)
  #          status  提出状況も取得
  #   email          ユーザ情報にメールアドレスを含める
  #   status なし    レポートの提出状況のみ取得
  #          solved  解いた問題のリストを取得
  #          record  レコード表示用に分類された解答済/未解答の問題のリストを取得
  #   log            提出ステータスの詳細ログを取得
  #   report         <report-id>のレポートに関する情報のみ取得
  #   filter         <assined_TA>の担当学生の情報のみ取得
  #                  (ユーザー名以外ならリモートユーザーの担当学生のみ)
  # Security:
  #   master.su に入っていないユーザに関しては user オプションによらず
  #   ログイン名が remote_user の情報のみ取得可能
  class User
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      users = app.users
      if !helper.params['user'].nil?
        users.select! do |u|
          (helper.params['user'] == u.real_login ||
           helper.params['user'] == u.token)
        end
      elsif !helper.params['filter'].nil?
        if users.any? { |u| helper.params['filter'] == u.login }
          users.select! do |u|
            helper.params['filter'] == u.assigned
          end
        else
          users.select! do |u|
            env['REMOTE_USER'] == u.assigned
          end
        end
      end

      if helper.params['type'] == 'status'
        schemes = app.conf[:scheme, :scheme].reject do |s|
          !helper.optional('report').include?(s['id'])
        end

        schemes.each do |s|
          users.each do |u|
            option = {
              status: helper.params['status'],
              log: !helper.params['log'].nil?
            }
            u[s['id']] = app.report(option, s['id'], u.real_login)
          end
        end
      end

      users.map!(&:to_hash)

      if !app.su? || helper.params['email'].nil?
        users.each { |u| u.delete('email') }
      end

      helper.json_response(users)
    end
  end
end
