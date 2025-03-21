# brYdge Backend API

Backend server for the brYdge music sample clearance platform. This API handles song uploads, sample matching, clearance requests, and user management.

## Features

- User authentication and profile management
- Song and sample upload with metadata
- Audio fingerprinting using Acoustid
- Clearance request workflow
- RESTful API endpoints

## Tech Stack

- Node.js
- Express.js
- MongoDB (via Mongoose)
- Multer for file uploads
- CORS for cross-origin requests

## Deployment on Render

This repository is configured for deployment on Render's free tier.

### Prerequisites

- A Render account (free tier is sufficient)
- A MongoDB Atlas account with a cluster set up

### Deployment Steps

1. **Fork or clone this repository to your GitHub account**

2. **Create a new Web Service on Render**
   - Go to the Render dashboard and click "New +"
   - Select "Web Service"
   - Connect your GitHub repository
   - Name your service (e.g., "brydge-backend")
   - Set the Environment to "Node"
   - Set the Build Command to `npm install`
   - Set the Start Command to `npm start`
   - Select the Free plan
   - Click "Create Web Service"

3. **Configure Environment Variables**
   - In your Render dashboard, go to your web service
   - Navigate to the "Environment" tab
   - Add the following environment variables:
     - `PORT`: 10000 (Render will override this with its own port)
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: A secure random string for JWT token generation
     - `NODE_ENV`: production
     - `ENABLE_DB`: true

4. **Deploy**
   - Render will automatically deploy your application
   - You can trigger manual deploys from the dashboard

5. **Verify Deployment**
   - Once deployed, your API will be available at `https://your-service-name.onrender.com`
   - Test the root endpoint to verify it's working: `https://your-service-name.onrender.com/`

## Local Development

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/brydge-backend.git
cd brydge-backend

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
ENABLE_DB=true
```

### Running the Server

```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## API Documentation

### Base URL

- Local: `http://localhost:5000`
- Production: `https://your-service-name.onrender.com`

### Endpoints

#### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get JWT token

#### Songs

- `GET /api/songs` - Get all songs
- `GET /api/songs/:id` - Get a specific song
- `POST /api/songs` - Upload a new song
- `PUT /api/songs/:id` - Update a song
- `DELETE /api/songs/:id` - Delete a song

#### Samples

- `GET /api/samples` - Get all samples
- `GET /api/samples/:id` - Get a specific sample
- `POST /api/samples` - Upload a new sample
- `PUT /api/samples/:id` - Update a sample
- `DELETE /api/samples/:id` - Delete a sample

#### Clearance Requests

- `GET /api/clearance-requests` - Get all clearance requests
- `GET /api/clearance-requests/:id` - Get a specific clearance request
- `POST /api/clearance-requests` - Create a new clearance request
- `PUT /api/clearance-requests/:id` - Update a clearance request
- `DELETE /api/clearance-requests/:id` - Delete a clearance request

#### Fingerprints

- `POST /api/fingerprints/generate` - Generate fingerprint for an audio file
- `POST /api/fingerprints/match` - Match a sample against the database

## License

ISC
