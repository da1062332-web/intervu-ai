# Mounted into the Judge0 containers as config/initializers/zz_intervu_logging.rb.
#
# Judge0 1.13.1 hard-codes `config.log_level = :debug` and only filters
# :password, so every request logged the full candidate source code (three
# times, including the SQL insert) plus hidden test input/output.
Rails.application.config.filter_parameters += %i[
  source_code stdin expected_output stdout stderr compile_output additional_files
]
Rails.logger.level = Logger::INFO
