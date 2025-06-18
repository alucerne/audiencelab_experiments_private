# AudienceLab v3 Web Application

## how to run

### prerequisites to have installed

- node + pnpm
- docker

### how to start local env

1. install dependencies

   ```bash
   pnpm dev
   ```

2. start supabase docker container

   ```bash
   pnpm run supabase:web:start
   ```

3. start nextjs

   ```bash
   pnpm dev
   ```

4. app is now running on [`http://localhost:3000`](http://localhost:3000)

5. to login to the app use these credentials: `test@audiencelab.io:testingpassword`

## helpful commands & tips

- reset db

  ```bash
  pnpm run supabase:web:reset
  ```

- generate db types

  ```bash
  pnpm run supabase:web:typegen
  ```

- url to view the local db: [`http://localhost:54323`](http://localhost:54323)

## integration.app features

### how to create an integration as a user

1. after logging in, go to the Audience Lists page and create an audience with any filters (does not matter)

   - [`http://localhost:3000/home/audience-lab`](http://localhost:3000/home/audience-lab)

2. now go to the Sync page and click create

   - [`http://localhost:3000/home/audience-lab/sync`](http://localhost:3000/home/audience-lab/sync)

3. pick an integration and fill out the questions to get it set up

4. and that's it, the web app will call the backend endpoint that exports the audience to the integration

### dev tips

- the integrations/sync ui pages are in this folder: [`apps/web/app/home/[account]/(integrations)`](<apps/web/app/home/[account]/(integrations)>)

- the core integration logic is in this folder: [`apps/web/lib/integration-app`](apps/web/lib/integration-app)

- the database table for the integrations is here: [`20250513191256_audience_sync.sql`](apps/web/supabase/migrations/20250513191256_audience_sync.sql)
