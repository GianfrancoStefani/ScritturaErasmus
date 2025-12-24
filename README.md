# ScritturaErasmus

A collaborative platform for Erasmus+ project writing and management.

## Tech Stack
-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **UI**: TailwindCSS, Radix UI, Dnd-kit, Lucide React

## Getting Started

### Prerequisites
-   Node.js 18+
-   PostgreSQL Database

### Setup
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables in `.env`:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/scritturaerasmus"
    AUTH_SECRET="your_secret"
    ```
4.  Run Prisma migrations:
    ```bash
    npx prisma generate
    npx prisma db push
    ```
5.  Start the development server:
    ```bash
    npm run dev
    ```

## Key Features
-   **Matrix Architecture**: Assign tasks to partners and track budgets.
-   **Kanban Board**: Drag-and-drop management of Work Packages and Modules.
-   **Role Management**: Granular permissions (Supervisor, Leader, Editor).
-   **Real-time Notifications**: Alerts for assignments and status changes.
-   **PDF/Excel Export**: Generate timesheets and budget reports.
