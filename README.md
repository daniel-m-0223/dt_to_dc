# Node.js TypeScript PostgreSQL CRUD API

A simple and robust Node.js TypeScript project with PostgreSQL CRUD operations using Express.js.

## Features

- ✅ **TypeScript** - Full TypeScript support with strict type checking
- ✅ **Express.js** - Fast, unopinionated web framework
- ✅ **PostgreSQL** - Database with connection pooling
- ✅ **CRUD Operations** - Complete Create, Read, Update, Delete functionality
- ✅ **Validation** - Input validation and error handling
- ✅ **Pagination** - Built-in pagination support
- ✅ **Error Handling** - Comprehensive error handling middleware
- ✅ **CORS** - Cross-Origin Resource Sharing enabled
- ✅ **Environment Variables** - Configuration via environment variables

## Project Structure

```
src/
├── config/
│   └── database.ts          # Database configuration and connection
├── controllers/
│   └── UserController.ts    # User business logic
├── middleware/
│   ├── errorHandler.ts      # Error handling middleware
│   └── validation.ts        # Input validation middleware
├── routes/
│   └── userRoutes.ts        # User API routes
├── services/
│   └── UserService.ts       # User data access layer
├── types/
│   └── User.ts              # TypeScript type definitions
├── app.ts                   # Express app configuration
└── index.ts                 # Application entry point
```

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone or download the project**
   ```bash
   cd your-project-directory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=crud_database
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up PostgreSQL database**
   - Create a PostgreSQL database named `crud_database` (or update the name in `.env`)
   - Make sure PostgreSQL server is running
   - The application will automatically create the required tables and triggers on startup

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Watch Mode (Development)
```bash
npm run watch
```

## API Endpoints

### Health Check
- **GET** `/health` - Check if the server is running

### Users API
- **GET** `/api/users` - Get all users (supports pagination)
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create a new user
- **PUT** `/api/users/:id` - Update user by ID
- **DELETE** `/api/users/:id` - Delete user by ID

## API Usage Examples

### Create a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

### Get All Users
```bash
curl http://localhost:3000/api/users
```

### Get Users with Pagination
```bash
curl "http://localhost:3000/api/users?page=1&limit=10"
```

### Get User by ID
```bash
curl http://localhost:3000/api/users/1
```

### Update User
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "age": 31
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Database Schema

The application creates a `users` table with the following structure:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  age INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The application also creates a PostgreSQL trigger to automatically update the `updated_at` timestamp when a record is modified.

## Validation Rules

- **Name**: Required, minimum 2 characters
- **Email**: Required, valid email format, unique
- **Age**: Optional, number between 0 and 150

## Error Handling

The application includes comprehensive error handling:

- Input validation errors (400)
- Resource not found errors (404)
- Database connection errors (500)
- Server errors (500)

## Development

### Scripts
- `npm run dev` - Start development server with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run watch` - Start development server with file watching

### TypeScript Configuration
The project uses strict TypeScript configuration with:
- Strict mode enabled
- ES2020 target
- CommonJS modules
- Source maps for debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use this project for learning or as a starting point for your own applications.
