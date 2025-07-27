# AudienceLab v3 Web Application

## how to run

### prerequisites to have installed

- node + pnpm
- docker

### how to start local env

1. install dependencies

   ```bash
   pnpm i
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

### how to add integrations

1. add a details needed for the integration to [the new sync form schema here](/apps/web/lib/integration-app/schema/new-sync-form.schema.ts#L11-L25)

2. create a form step component for the integration to get necessary details from the user and add it to [the new sync form here](</apps/web/app/home/[account]/(integrations)/sync/new/_components/new-sync-form.tsx#L38-L43>)

3. the form will save the integration details for when the audience is synced via the backend enqueue api. to send the necessary integration details to the api, be sure to update [the endpoint call here](/apps/web/lib/integration-app/audience-sync.service.ts#L129-L135)

4. [in this repo](https://github.com/AudienceLabV3/audience-sync), add an endpoint that handles parsing the audience and exporting it to the integration
