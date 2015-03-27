# coding: utf-8
require 'pathname'
require 'yaml'

require 'bundler/setup'
require 'kwalify'

#
# Provides access to configurations of master.yml, scheme.yml, and template.yml.
# Validation is executed when config files are loaded.
#
class Conf
  # Load config files and validate configs.
  def initialize
    reload
  end

  # Reload config files and validate configs.
  def reload
    local = begin load_yaml(FILES[:local]) rescue {} end
    @conf = {
      'master' => load_yaml(FILES[:master], FILES[:master_schema]).merge(local),
      'scheme' => load_yaml(FILES[:scheme]),
      'template' => load_yaml(FILES[:template]).merge(local)
    }
  end

  # Access to configs.
  # @param [Array<Symbol>] keys symbols describe the path to a config
  # @example
  #   # logger.path in master.yml
  #   logger_path = conf[:master, :logger, :path]
  # @raise [RuntimeError] if the config file is neither master, scheme, nor
  #   template
  def [](*keys)
    unless [:master, :scheme, :template].member? keys[0]
      fail "Unknown config files: #{keys[0]}"
    end
    keys.inject(@conf) { |acc, key| (acc || {})[key.to_s] }
  end

  private

  CONFIG = Pathname.new(File.dirname(File.expand_path(__FILE__))) + '../config'
  SCHEMA = CONFIG + 'schema'
  FILES = {
    master:        CONFIG + 'master.yml',
    local:         CONFIG + 'local.yml',
    template:      CONFIG + 'template.yml',
    scheme:        CONFIG + 'scheme.yml',
    master_schema: SCHEMA + 'master.yml'
  }

  # Raise errors if errors is not empty.
  # @param [String] message header message of errors
  # @param [Array<Error>] errors invoked by Kwalify
  # @raise [RuntimeError] if errors is not empty
  def invoke_errors(errors, message)
    message += "\n" + errors.map { |e| "[#{e.path}] #{e.message}" }.join("\n")
    fail message if errors && !errors.empty?
  end

  # Validate yaml file with a given schema file.
  # @param [Pathname] pathname the path of the yaml file.
  # @param [Pathname] schema_file the path of the schema file.
  def verify_yaml(pathname, schema_file)
    yml = File.open(pathname, 'r:utf-8') { |f| YAML.load(f, pathname) }
    schema = File.open(schema_file, 'r:utf-8') { |f| YAML.load(f, schema_file) }
    invoke_errors(
      Kwalify::MetaValidator.instance.validate(schema),
      "Internal error: schema '#{schema}'"
    )
    invoke_errors(
      Kwalify::Validator.new(schema).validate(yml),
      "Config file error: '#{pathname}'"
    )
  end

  # Load yaml files and if schema is given validate the yaml.
  # @param [Pathname] pathname
  # @param [Pathname] schema
  def load_yaml(pathname, schema = nil)
    yml = File.open(pathname, 'r:utf-8') { |f| YAML.load(f, pathname) }
    verify_yaml(pathname, schema) if schema
    yml
  end
end
