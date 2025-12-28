# Community Waste Reporting Platform

## Tech Stack (MERN)

### Core
- **Frontend:** React 18 + `react-router-dom`
- **Backend:** Node.js + Express.js
- **Database:** MongoDB + `mongoose`

### Image Handling
- `multer` - File upload handling
- `cloudinary` - Cloud storage with CDN
- `sharp` - Image compression
- `react-dropzone` - Upload UI with camera access

### Maps & Geolocation
- Browser Geolocation API - Get coordinates
- `react-leaflet` + `leaflet` - Interactive maps (FREE)
- MongoDB GeoJSON - Store location data
- `react-leaflet-cluster` - Marker clustering

### Authentication
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing
- Role-based access (citizen/authority)


### Dashboard & UI
- `recharts` - Statistics charts
- `@mui/material` - UI components
- `axios` - HTTP client

### Real-time (Optional)
- `socket.io` - Live dashboard updates

### Security & Utils
- `helmet` - HTTP security headers
- `cors` - CORS configuration
- `express-rate-limit` - Rate limiting
- `dotenv` - Environment variables
- `validator` - Input validation

### Development
- `concurrently` - Run client/server together
- `nodemon` - Auto-restart server

## Implementation Steps

1. **Project Setup**
   - Initialize React app (Vite) and Express server
   - Folder structure: `/client`, `/server` (routes, controllers, models, middleware, config)

2. **Authentication System**
   - Register/login endpoints with JWT
   - User model with role field (citizen/authority)
   - Password hashing with bcryptjs

3. **Waste Report Submission**
   - Report model with GeoJSON location schema
   - Multer middleware for image uploads
   - Cloudinary integration for storage
   - Browser geolocation for coordinates

4. **Interactive Map Interface**
   - Display reports as markers on Leaflet map
   - Marker clustering for dense areas
   - Popup with report details and images

5. **Authority Dashboard**
   - Charts showing open vs resolved reports
   - Filter by status/category/date
   - Update report status (authorities only)

6. **Real-time Notifications**
   - Socket.io for live dashboard updates
   - Broadcast new reports to authorities

## Database Schema

### Reports Collection
```javascript
{
  userId: ObjectId,
  title: String,
  description: String,
  images: [String], // Cloudinary URLs
  location: {
    type: 'Point',
    coordinates: [Number] // [longitude, latitude]
  },
  address: String,
  category: String, // 'plastic', 'organic', 'hazardous'
  status: String, // 'open', 'in-progress', 'resolved'
  severity: String, // 'low', 'medium', 'high'
  createdAt: Date,
  updatedAt: Date,
  resolvedBy: ObjectId
}
```

### Users Collection
```javascript
{
  name: String,
  email: String,
  password: String, // hashed
  role: String, // 'citizen' or 'authority'
  createdAt: Date
}
```

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/reports
POST   /api/reports (with image upload)
GET    /api/reports/:id
PUT    /api/reports/:id (authorities only)
DELETE /api/reports/:id
GET    /api/dashboard/stats (authorities only)
```

## Key Features

- **Citizens:** Submit reports with images and GPS location
- **Authorities:** Monitor dashboard, update report status, view statistics
- **Map View:** Visual representation of all waste hotspots
- **Real-time:** Live updates when reports are submitted/resolved
- **Mobile-Friendly:** Camera access and geolocation on mobile devices
