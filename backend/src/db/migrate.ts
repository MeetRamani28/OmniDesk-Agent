import { db } from './index';
import { INITIAL_SCHEMA } from './schema';

export function runMigrations(): void {
  console.log('[Migration] Starting database migration...');
  
  try {
    // Execute all queries in a highly consistent synchronous transaction
    db.exec('BEGIN TRANSACTION;');
    db.exec(INITIAL_SCHEMA);
    db.exec('COMMIT;');
    console.log('[Migration] Schema migration completed successfully.');
  } catch (error) {
    db.exec('ROLLBACK;');
    console.error('[Migration] Migration failed, rolling back.', error);
    process.exit(1);
  }
}

// If this file is executed directly via tsx/ts-node, trigger the runner
if (require.main === module) {
  runMigrations();
}
