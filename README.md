# Jira Lite

A cross-platform task management app built with Expo, React Native, TypeScript, and Supabase.

## Local Development

Install dependencies and run the web client:

```bash
npm install
npx expo start --web
```

The Supabase client uses the project's publishable/anon key. Never place a `service_role` key in the app. Authentication sessions use browser storage on web and AsyncStorage on native platforms.

## Supabase Database

The additive schema migration is `supabase/migrations/001_jira_lite_schema.sql`. Review it before applying it to the SQL Editor in your Supabase project. It adds profile synchronization, team invites, indexes, helper functions, and row-level security while retaining the existing teams, members, and tasks data.

Do not run the old SQL snippet in `jira-lite-complete-code.md`; it includes table-dropping statements and is not the current schema.

## Edge Functions

Deploy the task notification and invitation functions after reviewing their code:

```bash
supabase functions deploy send-task-notification
supabase functions deploy send-invite-email
```

Task push notifications require a registered Expo push token. Invitation rows work without email configuration; sending invitation email additionally requires the Edge Function secrets `RESEND_API_KEY` and `INVITE_FROM_EMAIL`. Configure them with the Supabase CLI, keeping the values out of the repository and frontend.

## Features

- Email/password authentication with unique usernames and Auth-linked profiles
- Team creation, member invitations, and pending invite acceptance
- Task assignment, status movement, team boards, and profile views
- Row-level security scoped to authenticated team owners and members