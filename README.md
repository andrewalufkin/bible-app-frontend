# Bible App

A modern Bible application with user authentication, note-taking, and social features.

## Project Structure

This project consists of two main parts:

- **Frontend**: React application with Tailwind CSS
- **Backend**: Flask API with MongoDB database

## Frontend

### Technologies

- React 19
- React Router
- Tailwind CSS
- Express.js (for production server)
- Lucide React (icons)

### Available Scripts

In the frontend directory, you can run:

#### `npm run dev`

Runs the app in development mode using React Scripts.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

#### `npm start`

Starts the production Express.js server that serves the built React application and proxies API requests to the backend.

#### `npm run build`

Builds the app for production to the `build` folder.

#### `npm test`

Launches the test runner in interactive watch mode.

## Backend

### Technologies

- Flask 3.0.0
- MongoDB with MongoEngine
- JWT Authentication
- Sentence Transformers (for NLP capabilities)
- Gunicorn (for production deployment)

### Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables in `.env`

4. Run the development server:
   ```
   python app.py
   ```

## Deployment

The application is configured for deployment on platforms like Railway:

- The frontend Express server serves the React build and proxies API requests to the backend
- The backend uses Gunicorn for production deployment

## Features

- Bible reading and searching
- User authentication
- Personal notes on Bible passages
- Friend connections
- Modern, responsive UI with Tailwind CSS

## Development

To work on this project:

1. Clone both the frontend and backend repositories
2. Set up the backend environment variables
3. Run the backend server
4. Run the frontend in development mode

For full-stack development, you'll need to run both the backend and frontend services.
