# Intentionality

A task management application built with Next.js that helps you organize your tasks with intention. Features multiple views including Inbox, Next Steps, Daily Tasks, and Projects with drag-and-drop organization.

## Features

- **Multiple Views**: Organize tasks by Inbox, Next Steps, Daily Tasks, or Projects
- **Drag & Drop**: Easily reorder tasks and projects
- **Daily Tasks**: Track recurring tasks with completion history
- **Dual Storage**: Supports both local (localStorage) and remote (PostgreSQL) storage modes
- **Dark Mode**: Built-in theme switching

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui components
- next-intl for internationalization

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file based on `.env.example`:

```bash
# Storage mode: 'local' or 'remote'
NEXT_PUBLIC_STORAGE_TYPE=local

# For remote storage mode (optional)
DATABASE_URL=your_postgresql_connection_string
```

### 3. Prepare git hooks

```bash
npm run prepare
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm run preview` - Build and start production server
- `npm run lint` - Lint code with ESLint
- `npm run lint:fix` - Fix linting errors
- `npm run test` - Run unit tests
- `npm run e2e` - Run end-to-end tests

## Storage Modes

**Local Mode** (default): Uses browser localStorage for data persistence. Great for personal use without needing a database.

**Remote Mode**: Uses PostgreSQL database for data persistence. Set `NEXT_PUBLIC_STORAGE_TYPE=remote` in your `.env` file and provide a `DATABASE_URL`.
