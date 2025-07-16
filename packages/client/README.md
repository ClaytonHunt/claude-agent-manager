# Claude Agent Manager - Client Dashboard

A comprehensive React/TypeScript dashboard for real-time monitoring of Claude Code agents with WebSocket integration.

## 🏗️ Architecture Overview

### Technology Stack
- **Build Tool**: Rsbuild (Rspack-based) for optimal performance
- **Framework**: React 18 with TypeScript
- **State Management**: Zustand for agent data and UI state
- **Styling**: Tailwind CSS with custom component system
- **Real-time**: Native WebSocket client for live updates
- **Routing**: React Router DOM v6
- **Icons**: Lucide React for consistent iconography
- **Testing**: Jest with React Testing Library setup

### Project Structure
```
packages/client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Basic UI components (Button, Card, etc.)
│   │   ├── layout/         # Layout components (Header, Sidebar)
│   │   └── agent/          # Agent-specific components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions and constants
│   └── styles/             # Global CSS and Tailwind config
├── public/                 # Static assets
└── dist/                   # Build output
```

## 🚀 Features

### Real-time Agent Monitoring
- **Live WebSocket Connection**: Automatic reconnection with exponential backoff
- **Agent Status Tracking**: Real-time status updates (idle, active, error, handoff, complete)
- **Log Streaming**: Live log entries with filtering and search
- **Project Organization**: Agents grouped by project with statistics

### Dashboard Views
1. **Dashboard**: Overview with key metrics and recent agents
2. **Agents**: Detailed agent list with filtering and search
3. **Projects**: Project-based view with aggregated statistics
4. **Logs**: Global log stream with advanced filtering
5. **Analytics**: Charts and insights about agent ecosystem

### Component Architecture

#### Common Components
- **Button**: Multi-variant button with loading states
- **Badge**: Status and category indicators
- **Card**: Container component with header/content/footer
- **StatusIndicator**: Visual status with animations
- **LoadingSpinner**: Loading states and error boundaries

#### Agent Components
- **AgentCard**: Compact agent overview with metadata
- **LogViewer**: Advanced log display with filtering and export

#### Layout Components
- **AppLayout**: Main application structure
- **Header**: Navigation and WebSocket status
- **Sidebar**: Collapsible navigation menu

### State Management

#### Agent Store (`useAgentStore`)
- Agent data management with real-time updates
- Filtering and search functionality
- API integration for CRUD operations
- Statistics computation

#### UI Store (`useUiStore`)
- Theme management (light/dark/system)
- Layout preferences (sidebar collapse, dashboard views)
- Notification system
- Modal state management

### WebSocket Integration

#### WebSocket Client (`utils/websocket.ts`)
- Native WebSocket with automatic reconnection
- Subscription-based channel system
- Heartbeat/ping-pong for connection health
- Error handling and status tracking

#### Hooks
- **useWebSocket**: Core WebSocket functionality
- **useAgentUpdates**: Real-time agent data updates
- **useProjectUpdates**: Project-level aggregations
- **useLogStream**: Live log streaming

### API Integration

#### REST API Client (`utils/api.ts`)
- Full CRUD operations for agents
- Project statistics and search
- Error handling and type safety
- Integration with server endpoints:
  - `GET /api/agents` - List agents with filtering
  - `POST /api/agents` - Register new agent
  - `PATCH /api/agents/:id/status` - Update status
  - `POST /api/agents/:id/logs` - Add log entries
  - `DELETE /api/agents/:id` - Remove agent
  - `POST /api/agents/handoff` - Agent handoff

### WebSocket Events
- **agent_update**: Real-time agent status and data changes
- **log_entry**: New log entries from agents
- **handoff**: Agent handoff notifications
- **ping/pong**: Connection health checks

## 🛠️ Development

### Scripts
```bash
npm run dev        # Start development server (port 3000)
npm run build      # Production build
npm run preview    # Preview production build
npm run type-check # TypeScript type checking
npm run lint       # ESLint code quality
npm run test       # Run tests
npm run clean      # Clean build artifacts
```

### Configuration

#### Rsbuild (`rsbuild.config.ts`)
- React plugin with hot reload
- TypeScript support
- Tailwind CSS integration
- Development proxy to server (port 3001)
- Production optimizations

#### Environment Variables
- `REACT_APP_API_URL`: Server API URL (default: http://localhost:3001)
- `REACT_APP_WS_URL`: WebSocket URL (default: ws://localhost:3001)

### Integration with Server

The client integrates seamlessly with the server package:

1. **API Compatibility**: Matches server REST endpoints exactly
2. **WebSocket Protocol**: Uses same message format as server
3. **Type Safety**: Shares types from `@claude-agent-manager/shared`
4. **Development Proxy**: Configured for local development

## 🎨 Design System

### Colors
- **Primary**: Blue palette for main actions and branding
- **Success**: Green for active/successful states
- **Warning**: Amber for handoff/warning states
- **Error**: Red for error states and alerts
- **Gray**: Neutral colors for text and backgrounds

### Components
- Consistent spacing using Tailwind scale
- Responsive design with mobile-first approach
- Accessibility considerations (focus states, ARIA labels)
- Dark mode support (system preference detection)

### Layout
- Collapsible sidebar navigation
- Fixed header with search and status
- Responsive grid systems for different content types
- Smooth animations and transitions

## 🚀 Deployment Ready

### Build Output
- Optimized bundle with code splitting
- CSS extraction and minification
- Asset hashing for cache busting
- Production-ready HTML template

### Performance
- Lazy loading of route components
- WebSocket connection pooling
- Efficient state updates with Zustand
- Memoized components and hooks

### Error Handling
- React Error Boundaries for graceful failure
- WebSocket connection error recovery
- API error handling with user feedback
- Development error overlays

## 🔄 Integration Points

### Server Communication
- REST API for initial data and mutations
- WebSocket for real-time updates
- Automatic retry mechanisms
- Connection status indicators

### Future Extensions
- Agent detail modals
- Advanced analytics with charts
- Export functionality for logs and data
- User authentication and permissions
- Multi-tenant support

This client dashboard provides a comprehensive foundation for monitoring Claude Code agents with real-time capabilities, professional UI/UX, and robust error handling. The architecture is designed for scalability and maintainability while delivering excellent developer and user experiences.