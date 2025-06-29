# Template System

This document outlines the template functionality integrated into the main application.

## Overview

The template system allows users to manage document templates with dynamic content placeholders. Templates are stored in the database and can be used to generate various documents.

## Key Components

1. **Database Storage**
   - Templates are stored in the `TemplateLink` table
   - Fields include: content, header, footer, logoPosition, isDefault

2. **API Endpoints**
   - `/template-links` - CRUD operations for templates
   - Supports filtering by template type

## Setup Instructions

1. Run the database migration script:
   ```
   cd backend
   node update-template-db.js
   ```

2. Ensure upload directories exist:
   ```
   mkdir -p backend/uploads/templates
   chmod 755 backend/uploads/templates
   ```

3. Configure environment variables:
   - `DATABASE_URL` must be properly set in backend/.env

## Usage

1. Access the template management at `/templates`
2. Create a new template with the "+" button
3. Set the Google Docs URL for the template
4. Save changes with the save button
5. Preview generated documents with the preview button

## Troubleshooting

- If templates fail to save, check file permissions in the uploads directory
- For 404 errors, verify the server is running on port 4000
- For database connection issues, check the DATABASE_URL environment variable

## Maintenance

Regular backups of templates are recommended. The system synchronizes templates periodically via the template-sync.js background service. 