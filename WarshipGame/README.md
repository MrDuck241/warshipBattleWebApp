# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

---

! Screenshoots of game are in folder public/screenshoots/ !

# WarshipGame

**WarshipGame** is an online browser game built using **React** with **Vite** for the frontend and **Node.js** for the backend. The game enables players to compete in the classic battleship game format, where each player manages their fleet and tries to sink their opponent's ships.

## Features

- **Classic Gameplay**: Two 10x10 grids per player – one for positioning ships and another for targeting the opponent.
- **Real-Time Multiplayer**: Communicates with the server via WebSockets for low-latency, real-time gameplay.
- **Environment Configuration**: Server IP and port are specified in the `.env` file.
- **Modern Development Setup**: React + Vite with hot module replacement for fast development.

## Installation

### Prerequisites

- **Node.js** (v16 or newer)
- **npm** or **yarn**

### Clone the Repository

```bash
git clone https://github.com/your-username/warship-game.git
cd warship-game

Run the Application

1. Install dependencies:
   npm install
2. Start the development server:
   npm run dev
   The application will run locally, typically at http://localhost:5173.

Run the Server
To start the server, run:
node warshipGameServerFile.js

Production Build and Deployment

1. Build the production version of the application:
   npm run build
   This will generate optimized production-ready static files in the dist/ directory.
2. Deploy the frontend:
   Upload the contents of the dist/ directory to a static file server like Apache, Nginx, or a hosting service (e.g., Netlify, Vercel).
   Make sure your static file server can handle React routes (e.g., add the necessary configurations for Apache).

Example for Apache:
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]

Gameplay
Each player positions their fleet on a 10x10 grid.
Players take turns targeting cells on their opponent's grid.
The first player to sink all of the opponent's ships wins the game.

Technologies Used

Frontend
React: UI library for building user interfaces.
Vite: Build tool for fast and efficient development.
JavaScript: Programming language for the frontend logic.

Backend
Node.js: Backend runtime for server-side logic.
WebSockets: Real-time communication protocol between the client and server.

License
This project is licensed under the GNU Affero General Public License v3.0.

Copyright (C) 2025 Przemek Kwiatkowski.

You can find the full text of the license in the LICENSE file.

For more information about this license, see https://www.gnu.org/licenses/agpl-3.0.en.html.
```
