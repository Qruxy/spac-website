/**
 * SPAC MCP Servers Entry Point
 *
 * This module exports three MCP servers:
 * - database: Query and manage SPAC member data, events, registrations
 * - migration: ETL tools for PHP to PostgreSQL migration
 * - photos: Batch process and upload photos to S3
 *
 * Usage:
 *   tsx src/index.ts database   # Start database MCP server
 *   tsx src/index.ts migration  # Start migration MCP server
 *   tsx src/index.ts photos     # Start photos MCP server
 */

import { spacDatabaseServer } from './servers/database.js';
import { migrationServer } from './servers/migration.js';
// import { photoServer } from './servers/photos.js';

const serverMap: Record<string, any> = {
  database: spacDatabaseServer,
  migration: migrationServer,
  // photos: photoServer,
};

async function main() {
  const serverName = process.argv[2];

  if (!serverName) {
    console.log('Available MCP servers:');
    console.log('  - database: Query and manage SPAC data');
    console.log('  - migration: Data migration tools (coming soon)');
    console.log('  - photos: Photo management tools (coming soon)');
    console.log('\nUsage: tsx src/index.ts <server-name>');
    process.exit(0);
  }

  const server = serverMap[serverName];

  if (!server) {
    console.error(`Unknown server: ${serverName}`);
    console.log('Available servers:', Object.keys(serverMap).join(', '));
    process.exit(1);
  }

  console.log(`Starting ${serverName} MCP server...`);

  // The server will handle stdio transport automatically
  // when started as an MCP server
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

// Export servers for programmatic use
export { spacDatabaseServer, migrationServer };
// export { photoServer };
