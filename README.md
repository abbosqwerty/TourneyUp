# TourneyUp

TourneyUp is a modern tournament discovery, organization, and ranking platform designed for sports, esports, and academic competitions. It allows participants to find and register for tournaments, while organizers can create events, manage brackets, track participants, and publish results.

---

## Features

- **Tournament Discovery**: Search and filter tournaments by category (Sports, Esports, Academic), location, date, and status.
- **Organizer Dashboard**: Centralized dashboard to monitor active tournaments, participant counts, approve/reject registrations, and review metrics.
- **Participant Tracking**: Manage player slots, team rosters, and real-time registration status.
- **Tournament Details**: Rich tournament overview including rules, schedule, prizes, brackets, and direct communication.
- **Live Rankings & Leaderboards**: Track competitive rankings, player statistics, and podium standings.
- **Interactive Messaging**: Dedicated messaging module for players and organizers to stay connected.
- **Theme Support**: Customizable color systems with dedicated dark and light modes.

---

## Tech Stack

- **Framework**: Next.js (App Router, Server Components & Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database & ORM**: Prisma ORM with relational database support
- **UI Components**: Radix UI primitives with custom accessible component architecture

---

## Getting Started

### Prerequisites

- Node.js (v18.17 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory and configure your database connection:
   ```env
   DATABASE_URL="your_database_connection_string"
   ```

3. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## Project Structure

```text
TourneyUp/
├── app/                  # Next.js App Router pages and route handlers
│   ├── (main)/           # Main application views (dashboard, feed, rankings, results)
│   ├── login/            # Authentication & demo mode entry point
│   ├── globals.css       # Design tokens, color palette, and global styles
│   └── layout.tsx        # Root layout, fonts, and theme providers
├── components/           # Reusable UI components and widgets
│   └── ui/               # Core atomic design system components (buttons, cards, dialogs)
├── lib/                  # Database client, utilities, and helper functions
├── prisma/               # Database schema definitions and migrations
└── public/               # Static assets, icons, and illustrations
```

---

## Available Scripts

- `npm run dev` - Starts the local development server with hot-reloading.
- `npm run build` - Compiles and optimizes the project for production.
- `npm run start` - Launches the compiled production server.
- `npm run lint` - Runs static code analysis with ESLint.
