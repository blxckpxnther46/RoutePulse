# RoutePulse

**Intelligent Campus Transport Optimization**

RoutePulse is a campus transport planning platform designed to improve shuttle allocation, estimate arrival times, identify overcrowding, and recommend feasible schedule adjustments under real-world constraints.

The platform combines an interactive transport map, fleet monitoring, passenger demand analytics, scenario simulation, and constraint-aware optimization in a single dashboard.

> **Project:** BUGGED OUT Hackathon, PS 06  
> **Problem Statement:** Optimise Campus Transport Under Real Constraints  
> **Data:** Simulated campus transport network. No live GPS tracking is claimed.

## Features

### Interactive Transport Map

Visualize transport routes, stops, and vehicles on an interactive Leaflet map using OpenStreetMap tiles. Inspect vehicle capacity, estimated arrivals, passenger demand, and route information.

### Fleet Management

View vehicle assignments, passenger counts, capacity utilization, service status, and schedule deviations. Identify overloaded vehicles and underutilized resources.

### Route and Stop Management

Manage routes, ordered stops, departure schedules, travel times, and vehicle assignments through a centralized interface.

### Demand Analytics

Explore passenger demand by route, stop, and time window. Identify peak periods, overcrowded stops, capacity mismatches, and potential missed connections.

### Constraint-Aware Optimization

Evaluate the current transport plan and recommend feasible adjustments based on:

- Vehicle capacity and availability
- Passenger demand
- Route compatibility
- Departure and operating windows
- Travel times and schedule constraints
- Passenger connections and waiting times

Recommendations include explanations, expected benefits, trade-offs, and feasibility checks.

### Scenario Simulation

Test simulated operating conditions, including:

- Normal operations
- Morning peak demand
- Traffic disruptions
- Vehicle breakdowns
- Event-day demand surges

### Baseline Evaluation and Reports

Compare the baseline transport plan against the optimized plan using calculated metrics such as passenger waiting time, capacity violations, missed connections, punctuality, and vehicle utilization.

Export comparison data as CSV and access printable reports.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript |
| Styling | Tailwind CSS |
| Interactive maps | Leaflet, OpenStreetMap |
| Analytics | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express, TypeScript |
| Development orchestration | concurrently |
| Initial persistence | Local backend data store |
| API communication | REST API |

## Project Structure

```text
RoutePulse/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── algorithms/
│   │   ├── middleware/
│   │   ├── data/
│   │   ├── types/
│   │   ├── app.ts
│   │   └── index.ts
│   └── package.json
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js 20 or later
- npm
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd RoutePulse
```

Replace `<repository-url>` with your repository URL.

### 2. Install Dependencies

Install the root development dependencies and both application dependencies:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 3. Configure Environment Variables

Create the server environment file using the example configuration:

```bash
cp .env.example server/.env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example server/.env
```

Configure the server port and any other required settings documented in `.env.example`.

### 4. Start Both Servers

Run this command from the repository root:

```bash
npm run dev
```

The root script uses `concurrently` to start the frontend and backend together.

| Service | Default URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Health check | http://localhost:3000/api/health |

The Vite development server proxies `/api` requests to the backend.

Use `Ctrl+C` to stop both development processes.

## API Overview

The backend exposes REST endpoints for transport data, simulation, optimization, and reporting.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend availability |
| GET | `/api/dashboard` | Retrieve overview metrics |
| GET | `/api/routes` | Retrieve routes and stops |
| POST | `/api/routes` | Create a route |
| PUT | `/api/routes/:id` | Update a route |
| DELETE | `/api/routes/:id` | Delete a route |
| GET | `/api/vehicles` | Retrieve fleet information |
| PUT | `/api/vehicles/:id` | Update a vehicle |
| GET | `/api/demand` | Retrieve demand analytics |
| GET | `/api/simulation/state` | Retrieve simulated transport state |
| POST | `/api/simulation/step` | Advance the simulation |
| POST | `/api/simulation/scenario` | Apply a scenario |
| POST | `/api/optimization/run` | Run the optimization engine |
| GET | `/api/optimization/results` | Retrieve optimization results |
| GET | `/api/reports/comparison` | Compare baseline and optimized plans |
| GET | `/api/reports/export` | Export report data as CSV |

Request and response formats should be documented alongside their corresponding backend routes.

## Optimization Methodology

RoutePulse is designed to use a deterministic, constraint-aware optimization engine rather than relying on an AI model to invent transport recommendations.

The engine evaluates the current transport scenario, identifies bottlenecks, checks operational constraints, and generates feasible adjustments where possible.

The evaluation compares the baseline and optimized plans under consistent scenario assumptions.

Metrics may include:

- Total and average estimated passenger waiting time
- Capacity violations
- Missed connections
- On-time departures
- Vehicle utilization
- Number of vehicles deployed

All reported improvements must be calculated from the implemented simulation and evaluation logic. Results depend on the input data, defined constraints, and optimization strategy.

## Data and Simulation

RoutePulse uses simulated transport data to demonstrate campus mobility planning without requiring access to an actual fleet.

The initial dataset is intended to include multiple routes, stops, vehicles, departure schedules, passenger demand, and disruption scenarios.

Vehicle movement, arrival estimates, and demand changes are simulated. They should not be interpreted as live GPS observations or verified predictions about actual campus operations.

## Production Build

Build both applications:

```bash
npm run build
```

Start the backend using the root start script:

```bash
npm start
```

The production frontend must be served separately by a static hosting service or configured web server unless production static-file serving is explicitly implemented in the backend.

## Development Guidelines

- Keep frontend components separate from API communication.
- Keep optimization logic independent of Express route handlers.
- Use shared, consistent TypeScript data models within each application.
- Validate incoming API requests.
- Centralize error handling.
- Keep secrets and local environment files out of version control.
- Ensure all metrics are derived from the underlying scenario data.
- Test optimization recommendations against hard constraints.
- Document assumptions and limitations.

## Future Scope

Potential extensions include:

- PostgreSQL persistence
- Live GPS and vehicle telemetry integrations
- Historical demand forecasting
- More advanced mathematical optimization
- Multi-campus transport planning
- Role-based access control
- Notifications for disruptions and missed connections

These extensions are outside the required initial simulation-based MVP unless explicitly implemented.

## Team and Credits

Developed as part of the **BUGGED OUT Hackathon**, addressing PS 06: Optimise Campus Transport Under Real Constraints.

**RoutePulse: Better transport decisions through transparent optimization.**