# Task Management JSON Formats

This document defines the JSON formats used for task management data structures in the ADHD Planner application.

## Core Data Types

### Task Object

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "priority": "high" | "medium" | "low",
  "dueDate": "ISO 8601 date string or null",
  "completed": "boolean",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string",
  "deletedAt": "ISO 8601 date string or null",
  "tags": ["string"],
  "projectId": "string or null",
  "categoryId": "string or null",
  "estimatedDuration": "number (minutes) or null",
  "actualDuration": "number (minutes) or null",
  "dependencies": ["task id strings"],
  "recurrence": "RecurrencePattern or null",
  "subtasks": ["Subtask objects"],
  "notes": "string or null",
  "attachments": ["Attachment objects"],
  "reminders": ["Reminder objects"],
  "energyLevel": "high" | "medium" | "low" | null,
  "focusTime": "number (minutes) or null",
  "location": "string or null",
  "context": "string or null",
  "progress": "number (0-100)"
}
```

### Subtask Object

```json
{
  "id": "string",
  "title": "string",
  "completed": "boolean",
  "order": "number"
}
```

### Project Object

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "color": "string (hex color)",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string",
  "deletedAt": "ISO 8601 date string or null",
  "status": "active" | "completed" | "archived",
  "dueDate": "ISO 8601 date string or null",
  "progress": "number (0-100)",
  "milestones": ["Milestone objects"],
  "tags": ["string"]
}
```

### Category Object

```json
{
  "id": "string",
  "name": "string",
  "color": "string (hex color)",
  "icon": "string (icon name) or null",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

### RecurrencePattern Object

```json
{
  "pattern": "daily" | "weekly" | "monthly" | "yearly" | "custom",
  "interval": "number",
  "daysOfWeek": ["number (0-6, where 0 is Sunday)"],
  "dayOfMonth": "number (1-31) or null",
  "endDate": "ISO 8601 date string or null",
  "occurrences": "number or null"
}
```

### TimeBlock Object

```json
{
  "id": "string",
  "taskId": "string or null",
  "title": "string",
  "description": "string or null",
  "startTime": "ISO 8601 date string",
  "endTime": "ISO 8601 date string",
  "type": "task" | "break" | "focus" | "meeting" | "personal",
  "color": "string (hex color) or null",
  "reminder": "boolean",
  "reminderMinutes": "number or null"
}
```

### WeeklyReview Object

```json
{
  "id": "string",
  "weekStartDate": "ISO 8601 date string",
  "weekEndDate": "ISO 8601 date string",
  "completedTasks": "number",
  "totalTasks": "number",
  "wins": ["string"],
  "challenges": ["string"],
  "learnings": ["string"],
  "nextWeekPriorities": ["string"],
  "mood": "excellent" | "good" | "okay" | "challenging" | "difficult",
  "productivityScore": "number (1-10)",
  "notes": "string or null",
  "createdAt": "ISO 8601 date string"
}
```

### WorkSchedule Object

```json
{
  "monday": "DaySchedule",
  "tuesday": "DaySchedule",
  "wednesday": "DaySchedule",
  "thursday": "DaySchedule",
  "friday": "DaySchedule",
  "saturday": "DaySchedule",
  "sunday": "DaySchedule",
  "timezone": "string (IANA timezone)"
}
```

### DaySchedule Object

```json
{
  "isWorkDay": "boolean",
  "startTime": "string (HH:MM format) or null",
  "endTime": "string (HH:MM format) or null",
  "breaks": ["BreakPeriod objects"]
}
```

### BreakPeriod Object

```json
{
  "startTime": "string (HH:MM format)",
  "endTime": "string (HH:MM format)",
  "type": "lunch" | "short" | "other"
}
```

### Attachment Object

```json
{
  "id": "string",
  "filename": "string",
  "url": "string",
  "type": "string (MIME type)",
  "size": "number (bytes)",
  "uploadedAt": "ISO 8601 date string"
}
```

### Reminder Object

```json
{
  "id": "string",
  "time": "ISO 8601 date string",
  "type": "notification" | "email" | "sms",
  "message": "string or null",
  "sent": "boolean"
}
```

### Milestone Object

```json
{
  "id": "string",
  "title": "string",
  "description": "string or null",
  "dueDate": "ISO 8601 date string",
  "completed": "boolean",
  "completedAt": "ISO 8601 date string or null"
}
```

## API Response Formats

### Success Response

```json
{
  "success": true,
  "data": "any",
  "message": "string or null"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "any or null"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": ["array of items"],
    "pagination": {
      "page": "number",
      "pageSize": "number",
      "totalItems": "number",
      "totalPages": "number",
      "hasNext": "boolean",
      "hasPrevious": "boolean"
    }
  }
}
```

## Import/Export Formats

### Full Data Export

```json
{
  "version": "string",
  "exportDate": "ISO 8601 date string",
  "data": {
    "tasks": ["Task objects"],
    "projects": ["Project objects"],
    "categories": ["Category objects"],
    "timeBlocks": ["TimeBlock objects"],
    "weeklyReviews": ["WeeklyReview objects"],
    "workSchedule": "WorkSchedule object",
    "settings": {
      "theme": "light" | "dark" | "system",
      "notifications": "boolean",
      "defaultView": "string",
      "aiProvider": "string or null",
      "aiApiKey": "string or null"
    }
  }
}
```

### Task Import Format

```json
{
  "version": "string",
  "tasks": [
    {
      "title": "string (required)",
      "description": "string (optional)",
      "priority": "high" | "medium" | "low" (optional, defaults to 'medium')",
      "dueDate": "ISO 8601 date string (optional)",
      "tags": ["string"] (optional),
      "projectName": "string (optional, will create/link project)",
      "categoryName": "string (optional, will create/link category)",
      "subtasks": ["string"] (optional, creates subtasks from titles)
    }
  ]
}
```

## Validation Rules

### Task Validation

- `title`: Required, non-empty string, max 200 characters
- `priority`: Must be one of ["high", "medium", "low"]
- `dueDate`: If provided, must be a valid ISO 8601 date string
- `estimatedDuration`: If provided, must be positive number
- `progress`: Must be between 0 and 100

### Project Validation

- `name`: Required, non-empty string, max 100 characters
- `color`: Must be valid hex color format (#RRGGBB)
- `progress`: Must be between 0 and 100

### Category Validation

- `name`: Required, non-empty string, max 50 characters
- `color`: Must be valid hex color format (#RRGGBB)

### TimeBlock Validation

- `startTime`: Required, must be valid ISO 8601 date string
- `endTime`: Required, must be after startTime
- `type`: Must be one of ["task", "break", "focus", "meeting", "personal"]

## Example Usage

### Creating a Task

```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive documentation for the API endpoints",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59Z",
  "projectId": "proj_123",
  "categoryId": "cat_456",
  "tags": ["documentation", "api"],
  "estimatedDuration": 120,
  "subtasks": [
    {
      "id": "sub_1",
      "title": "Document authentication endpoints",
      "completed": false,
      "order": 1
    },
    {
      "id": "sub_2",
      "title": "Document task management endpoints",
      "completed": false,
      "order": 2
    }
  ]
}
```

### Creating a Time Block

```json
{
  "taskId": "task_789",
  "title": "Focus time for documentation",
  "startTime": "2024-12-15T14:00:00Z",
  "endTime": "2024-12-15T16:00:00Z",
  "type": "focus",
  "reminder": true,
  "reminderMinutes": 15
}
```

## Notes

- All date/time values should be in ISO 8601 format
- IDs are typically generated using UUID v4 or similar unique identifier schemes
- Colors should be in hex format (#RRGGBB)
- Deleted items retain their data but have a non-null `deletedAt` timestamp
- Progress values are integers from 0-100 representing percentage complete
