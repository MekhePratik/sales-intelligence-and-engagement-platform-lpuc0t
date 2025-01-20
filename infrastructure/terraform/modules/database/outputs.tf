###############################################################################
# Terraform Outputs Configuration File
# Exposes essential Supabase PostgreSQL database connection and configuration
# values as specified in the technical and JSON specifications. This file
# references internal resources declared in main.tf:
#   - supabase_database.main       (Provides connection string, host)
#   - supabase_database_replica.*  (Provides read replica connection strings)
#   - supabase_database_backup.*   (Provides backup retention details, PITR)
#
# Third-Party/External Import:
#   - hashicorp/terraform (>=1.0) // Core Terraform functionality for output definitions
###############################################################################

###############################################################################
# OUTPUT: database_connection_string
# PURPOSE:
#   - Primary database connection string for application use, referencing the
#     supabase_database.main resource. Marked sensitive to prevent logging of
#     credentials.
# MEMBERS EXPOSED:
#   - value: string (sensitive)
#   - description: string
###############################################################################
output "database_connection_string" {
  description = "Primary database connection string for the main Supabase PostgreSQL instance (Sensitive)."
  sensitive   = true

  # Reference the resource attribute supabase_database.main.connection_string.
  # In the main.tf, we see that 'connection_string' must be accessed from the resource output,
  # typically supabase_database.main.connection_string. Adjust as necessary if the actual
  # attribute name differs.
  value = supabase_database.main.connection_string
}

###############################################################################
# OUTPUT: database_host
# PURPOSE:
#   - Database host endpoint for connection configuration, referencing
#     supabase_database.main.host. Not marked sensitive.
# MEMBERS EXPOSED:
#   - value: string
#   - description: string
###############################################################################
output "database_host" {
  description = "Database host endpoint for main Supabase PostgreSQL instance."
  value       = supabase_database.main.host
}

###############################################################################
# OUTPUT: read_replica_connection_strings
# PURPOSE:
#   - List of connection strings referencing read replica instances from
#     supabase_database_replica.replica[].connection_strings. Marked sensitive.
# MEMBERS EXPOSED:
#   - value: list(string) (sensitive)
#   - description: string
###############################################################################
output "read_replica_connection_strings" {
  description = "List of connection strings for Supabase read replica instances (Sensitive)."
  sensitive   = true

  # Because read replicas can be created in a count-based loop, flatten all
  # connection_urls from each supabase_database_replica instance. This ensures
  # that different replicas can each provide multiple connection strings.
  value = flatten([
    for replica in supabase_database_replica.replica : replica.connection_strings
  ])
}

###############################################################################
# OUTPUT: backup_retention_period
# PURPOSE:
#   - Number of days database backups are retained in the Supabase environment,
#     referencing supabase_database_backup.backup.retention_days.
# MEMBERS EXPOSED:
#   - value: number
#   - description: string
###############################################################################
output "backup_retention_period" {
  description = "Number of days that database backups are retained for the main Supabase PostgreSQL instance."
  value       = supabase_database_backup.backup.retention_days
}

###############################################################################
# OUTPUT: point_in_time_recovery_enabled
# PURPOSE:
#   - Boolean indicating if point-in-time recovery (PITR) is enabled, referencing
#     supabase_database_backup.backup.pitr_enabled.
# MEMBERS EXPOSED:
#   - value: bool
#   - description: string
###############################################################################
output "point_in_time_recovery_enabled" {
  description = "Indicates if point-in-time recovery (PITR) is enabled for the database backups."
  value       = supabase_database_backup.backup.pitr_enabled
}