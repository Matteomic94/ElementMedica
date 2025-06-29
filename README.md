# Backend Server

This directory contains the server-side components of the application, including API endpoints, database operations, and template handling.

## New Modular Structure

The backend has been restructured into a modular architecture:

- `src/`: Main source directory with modular components
  - `config/`: Configuration files and environment setup
  - `controllers/`: Business logic for handling requests
  - `middlewares/`: Express middleware functions (auth, logging, error handling)
  - `routes/`: API route definitions
  - `utils/`: Utility functions and helpers
  - `services/`: Background services and shared functionality
  - `public/api-docs/`: Generated API documentation

- `scripts/`: Organized utility scripts
  - `utilities/`: General utility scripts
  - `db-maintenance/`: Database maintenance tools

- `tests/`: Automated test suite
  - `unit/`: Unit tests for individual components
  - `integration/`: Integration tests across components
  - `fixtures/`: Test data and fixtures

- `docs/`: Documentation
  - `api/`: API specifications in OpenAPI format

- `logs/`: Centralized logging directory with rotated log files
- `_archived_scripts/`: Storage for obsolete or rarely used scripts
- `_archived_configs/`: Backup of previous configuration files
- `uploads/`: Directory for storing uploaded files and templates

## Environment Variables

- `DATABASE_URL`: Connection string for the database
- `PORT`: Server port (default: 4000)
- `JWT_SECRET`: Secret key for JWT token generation
- `LOG_LEVEL`: Logging verbosity (default: info)

## Development

To start the server:

```bash
# Standard startup
npm start

# Optimized startup with environment checks
npm run start:optimized
```

## API Documentation

The API is documented using OpenAPI/Swagger:

```bash
# Generate API documentation
npm run docs:api

# Access at http://localhost:4000/api-docs when server is running
```

## Error Handling

The system now includes a centralized error handling system with custom error classes in `src/middlewares/error-handler.js`:

- `ApiError`: Base error class for custom API errors
- `ValidationError`: For validation failures
- `DatabaseError`: For database-related issues
- `AuthenticationError`: For authentication failures

## Logging

Advanced logging system in `src/utils/logger.js` with:

- Log rotation and separate files for different log levels
- Domain-specific logging methods
- Automatic exception and rejection handling

## Testing

Testing infrastructure is available in the `tests/` directory:

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Test fixtures: `tests/fixtures/`

Run tests using:

```bash
npm test            # All tests
npm run test:unit   # Unit tests only
npm run test:integration # Integration tests only
```

## Optimization Scripts

The codebase includes various optimization scripts:

- `organize-backend.sh`: Organizes the backend file structure
- `modularize-backend.sh`: Creates the modular architecture
- `complete-modularization.sh`: Finalizes the modular structure
- `final-cleanup.sh`: Cleans up remaining files
- `optimize-final.sh`: Adds final optimizations including API docs

## Maintenance Notes

- Template endpoint requires proper upload directory configuration
- All file paths should use path.join() for cross-platform compatibility
- Database operations should be wrapped in try-catch blocks with proper error handling
- Update OpenAPI documentation when modifying API endpoints
- Add tests for new functionality 