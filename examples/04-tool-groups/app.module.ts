import { Module } from '@nestjs/common';
import { McpModule } from '../../src';
import { FilesService } from './files.service';
import { DatabaseService } from './database.service';

/**
 * Tool groups example: @McpToolGroup prefixes tool names to avoid collisions.
 * FilesService tools → files_list, files_read, files_write
 * DatabaseService tools → db_query, db_tables
 */
@Module({
  imports: [
    McpModule.forRoot({
      name: 'tool-groups-example',
      version: '1.0.0',
      transports: { sse: { enabled: true } },
      playground: true,
    }),
  ],
  providers: [FilesService, DatabaseService],
})
export class AppModule {}
