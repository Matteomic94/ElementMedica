# Login Instructions

The application is now set up to work with a standalone mock API on port 4001.

## Credentials

You can log in using one of the following sets of credentials:

### Admin User
- Email: admin@example.com **or** test@admin.com
- Password: password **or** admin123
- Permissions: Full administrative access to all areas of the application

### Standard User
- Email: user@example.com
- Password: password
- Permissions: Read-only access to users, courses, schedules, and trainers

## Running the Application

1. First, start the standalone API server:
   ```
   cd backend && node standalone-api.js
   ```

2. Then, in a separate terminal, start the frontend:
   ```
   npm run dev
   ```

3. Open your browser to http://localhost:5173

## Quick Start

For convenience, you can use the `start-app.sh` script to start both the API server and frontend:
```
bash start-app.sh
```

## Testing the Login API Directly

To test the login API directly without the frontend React app, you can use the provided login-test.html file:

1. Make sure the standalone API server is running on port 4001
2. Open the login-test.html file in your browser
3. The credentials are pre-filled, just click the "Login" button
4. You should see the API response and then the token verification response

This allows you to confirm that the API endpoints are working correctly.

## Available Endpoints

The standalone API now includes the following endpoints:

- `/api/lettere-incarico/status` - Status information
- `/users` - User list
- `/roles` - Role list
- `/permissions` - Permissions list
- `/attestati` - Certificates
- `/schedules` - Course schedules
- `/activity-logs` - User activity logs
- `/lettere-incarico-base` - Assignment letters
- `/auth/login` - Login endpoint
- `/auth/verify` - Token verification
- `/courses` - Course list
- `/trainers` - Trainer list
- `/companies` - Company list
- `/employees` - Employee list

## Recent Fixes

The following issues have been resolved:

1. **Added Missing Endpoints**:
   - Added `/schedules` endpoint to fix 500 errors in Dashboard and ScheduledCoursesPage
   - Added `/activity-logs` endpoint to fix 404 errors
   - Added `/courses`, `/trainers`, `/companies`, and `/employees` endpoints to support Dashboard functionality

2. **Enhanced Login Support**:
   - Added support for both `admin@example.com` and `test@admin.com` email addresses
   - Added support for both `password` and `admin123` passwords
   - Updated the login-test.html tool to include a user selector dropdown
   - Fixed permission issues to ensure test@admin.com receives full administrative access
   - Added comprehensive permission system:
     - Universal "all:*" wildcard permissions
     - Resource-wide permissions with "resource:all" format  
     - Enhanced permission checking that recognizes both Admin and Administrator roles

3. **Improved Error Handling**:
   - Better error reporting in the API response
   - More robust handling of API responses in frontend components

## Troubleshooting

If you encounter issues with port conflicts (EADDRINUSE errors), make sure no other process is using port 4001:

```
pkill -f "node standalone-api.js"
lsof -i :4001
```

Then restart the standalone API server.

### Browser Console

If you're having login issues, open your browser's developer console (F12) to see the detailed error messages we've added. Look for:

- Request and response logs
- Any error messages
- Login credential handling 