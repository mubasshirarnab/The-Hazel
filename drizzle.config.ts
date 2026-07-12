import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: 'mysql://root@localhost:3306/hazel_erp',
  },
  tablesFilter: ['tbl_*'],
});
