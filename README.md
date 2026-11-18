# ProjectIQ -


Intelligent Project Planning, Execution & Risk Management Platform

ProjectIQ is a web-based project management platform designed to help teams plan, organize, monitor and manage project execution. It combines task management, team collaboration, dependency tracking, critical path analysis, Gantt visualization and project risk management in one application.

# Problem Statement

Managing projects across multiple tasks, dependencies, team members and risks can become complex. Traditional task trackers often provide limited visibility into project timelines and execution risks.

ProjectIQ addresses this challenge by providing a centralized platform that helps project owners understand project progress, identify critical activities and proactively manage risks.


# Key Features

User Authentication: Secure registration and login.

Project Management: Create, view and manage projects.

Task Management: Create, edit, delete and track tasks.

Team Management: Add and remove project members.

Task Assignment: Assign tasks to project team members.

Task Dependencies: Define dependencies between tasks with circular dependency validation.

Critical Path Method (CPM): Calculate project duration, earliest and latest schedules, task float and critical tasks.

Gantt Chart: Visualize task schedules and critical activities.

Risk Management: Create, assess, update and resolve project risks.

Risk Scoring: Calculate risk scores using probability × impact.

Dashboard: Monitor project statistics, overdue tasks, critical tasks and unresolved risks.



# Technology Stack

React.js
Node.js, Express.js
MongoDB Atlas
Mongoose
JWT
CSS

# Core Algorithms

~ Critical Path Method

ProjectIQ implements the Critical Path Method to identify the sequence of dependent tasks that determines the minimum project completion time.

The implementation uses:
Topological sorting
Forward pass
Backward pass
Total float calculation
Critical task identification

~ Risk Assessment

Each risk is evaluated using:
Risk Score = Probability × Impact
Risks are classified into Low, Medium, High and Critical categories.

~ Application Architecture

The application follows a MERN-based client-server architecture.

React frontend: Provides the user interface and communicates with backend APIs.

Express backend: Handles application routes, authentication and business logic.

MongoDB database: Stores users, projects, tasks and risks.

Service layer: Handles critical path calculations.


## Requirements
- Node.js 18.18+ (Node 20 LTS recommended)
- npm
- MongoDB Atlas free cluster OR local MongoDB Community Server

## 1. Configure MongoDB
Create a MongoDB Atlas cluster, create a database user, allow your IP address, and copy the connection string.
Replace `<username>`, `<password>`, and database name in the URI.

## 2. Backend setup
Open a terminal in `projectiq-core/server`:

```bash
npm install
```

Copy `.env.example` to `.env` and fill in:
- `MONGODB_URI`
- `JWT_SECRET` (use a long random secret)
- `CLIENT_URL=http://localhost:5173`

Start the API:

```bash
npm run dev
```

API runs at http://localhost:5000.
Health check: http://localhost:5000/api/health

## 3. Frontend setup
Open a second terminal in `projectiq-core/client`:

```bash
npm install
```

Copy `.env.example` to `.env` (default API URL is already correct), then:

```bash
npm run dev
```

Open http://localhost:5173.

~ Project Structure

projectiq-core/
├── client/
│   └── src/
├── server/
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── services/
└── README.md

~ Future Enhancements

Resource allocation and workload management

Advanced project analytics

AI-assisted project planning

Predictive risk analysis

Project notifications and reporting

~ Project Objective

ProjectIQ demonstrates the application of full-stack development, database design, REST API development, project scheduling algorithms and risk assessment techniques to solve practical project management challenges.