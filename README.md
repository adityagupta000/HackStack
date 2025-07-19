# Event Management System - Hack-a-Fest

A comprehensive full-stack event management platform built with React.js frontend and Node.js backend, designed for organizing and managing hackathons and technical events.

## 🚀 Features

### User Features
- **User Authentication**: Secure registration, login, and password reset with JWT tokens
- **Event Discovery**: Browse events by categories (Software, Hardware, Robotics, IoT, AI/ML, Cybersecurity)
- **Event Registration**: Register for events with custom registration fields
- **User Dashboard**: View registered events, download receipts, and manage registrations
- **PDF Receipts**: Generate QR code-enabled registration receipts
- **Feedback System**: Submit feedback for attended events
- **Calendar Integration**: View events in calendar format
- **Email Notifications**: Password reset and registration confirmations

### Admin Features
- **Admin Dashboard**: Comprehensive analytics with charts and statistics
- **User Management**: Manage user roles and permissions
- **Event Management**: Create, edit, and delete events with image and PDF uploads
- **Registration Management**: View and manage all event registrations
- **Feedback Review**: Monitor and review user feedback
- **File Upload**: Support for event images and rule book PDFs

### Technical Features
- **Responsive Design**: Mobile-first approach with Bootstrap and Tailwind CSS
- **Real-time Updates**: Dynamic content updates without page refresh
- **File Management**: Secure file upload and storage system
- **Rate Limiting**: Protection against spam and abuse
- **Token Refresh**: Automatic JWT token refresh for seamless user experience
- **QR Code Verification**: Secure registration verification system

## 🛠️ Technology Stack

### Frontend
- **React.js** - Component-based UI library
- **React Router** - Client-side routing
- **Bootstrap 5** - CSS framework for responsive design
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API requests
- **React Hot Toast** - Toast notifications
- **React Calendar** - Calendar component
- **FontAwesome** - Icon library
- **Recharts** - Chart library for analytics

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload middleware
- **Nodemailer** - Email sending
- **PDFKit** - PDF generation
- **QRCode** - QR code generation
- **Express Rate Limit** - Rate limiting middleware
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── config/
│   │   ├── db.js                 # Database configuration
│   │   └── keys.js               # Environment variables validation
│   ├── controllers/
│   │   ├── adminController.js    # Admin operations
│   │   ├── authController.js     # Authentication logic
│   │   ├── eventController.js    # Event management
│   │   ├── feedbackController.js # Feedback handling
│   │   ├── registrationController.js # Registration logic
│   │   └── verificationController.js # QR verification
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT authentication
│   │   ├── errorMiddleware.js    # Error handling
│   │   ├── rateLimit.js          # Rate limiting
│   │   ├── upload.js             # File upload handling
│   │   └── uploadMiddleware.js   # Upload configuration
│   ├── models/
│   │   ├── Event.js              # Event schema
│   │   ├── Feedback.js           # Feedback schema
│   │   ├── Registration.js       # Registration schema
│   │   └── User.js               # User schema
│   ├── routes/
│   │   ├── adminRoutes.js        # Admin API routes
│   │   ├── authRoutes.js         # Authentication routes
│   │   ├── eventRoutes.js        # Event routes
│   │   ├── feedbackRoutes.js     # Feedback routes
│   │   ├── protectedRoutes.js    # Protected routes
│   │   ├── registrationRoutes.js # Registration routes
│   │   └── verifyRoutes.js       # Verification routes
│   ├── uploads/                  # File storage directory
│   └── server.js                 # Main server file
├── src/
│   ├── components/
│   │   ├── admin/                # Admin panel components
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── EventManagement.jsx
│   │   │   ├── FeedbackReview.jsx
│   │   │   ├── RegistrationManagement.jsx
│   │   │   └── UserManagement.jsx
│   │   ├── AdminPanel.jsx        # Main admin interface
│   │   ├── CardFunction.jsx      # Event card component
│   │   ├── Carousel.jsx          # Hero carousel
│   │   ├── Event.js              # Event listing
│   │   ├── Home.js               # Home page
│   │   ├── Time.js               # Countdown timer
│   │   ├── UserDashboard.jsx     # User dashboard
│   │   └── partner.jsx           # Sponsors section
│   ├── context/
│   │   └── AuthContext.js        # Authentication context
│   ├── pages/
│   │   ├── About.js              # About page
│   │   ├── Footer.jsx            # Footer component
│   │   ├── ForgotPassword.jsx    # Password reset
│   │   ├── Login.jsx             # Login page
│   │   ├── Register.jsx          # Registration page
│   │   ├── ResetPassword.jsx     # Password reset form
│   │   └── VerifyPage.jsx        # QR verification page
│   ├── utils/
│   │   └── axiosInstance.js      # Axios configuration
│   ├── images/                   # Static images
│   └── App.js                    # Main React component
├── public/                       # Public assets
├── package.json                  # Frontend dependencies
└── README.md                     # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-management-system
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the backend directory:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/hackathon-db
   
   # JWT Secrets
   JWT_SECRET=your-jwt-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   JWT_ACCESS_EXPIRY=1h
   JWT_REFRESH_EXPIRY=7d
   
   # Email Configuration
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Rate Limiting
   LOGIN_LIMIT_WINDOW=300000
   LOGIN_LIMIT_MAX=5
   GLOBAL_LIMIT_WINDOW=60000
   GLOBAL_LIMIT_MAX=100
   ```

5. **Database Setup**
   - Ensure MongoDB is running
   - The application will create necessary collections automatically

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   Server will run on http://localhost:5000

2. **Start the Frontend Development Server**
   ```bash
   cd ../
   npm start
   ```
   Application will open at http://localhost:3000

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password/:token` - Password reset
- `POST /api/auth/refreshToken` - Refresh JWT token

### Events
- `GET /api/events` - Get all events
- `GET /api/events?category=SOFTWARE` - Filter events by category
- `POST /api/events` - Create event (Admin only)
- `PUT /api/events/:id` - Update event (Admin only)
- `DELETE /api/events/:id` - Delete event (Admin only)
- `POST /api/events/:id/upload-rulebook` - Upload rule book
- `GET /api/events/:id/rulebook` - Download rule book

### Registrations
- `POST /api/registrations/:eventId/register` - Register for event
- `GET /api/registrations/my-registrations` - Get user registrations
- `GET /api/registrations/:registrationId/pdf` - Download receipt

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Change user role
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/events` - Get all events (Admin view)
- `GET /api/admin/registrations` - Get all registrations
- `GET /api/admin/feedbacks` - Get all feedback

### Verification
- `GET /api/verify/:token` - Verify registration QR code

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Server-side validation for all inputs
- **CORS Configuration**: Controlled cross-origin requests
- **Helmet Security**: Security headers for Express
- **File Upload Security**: Restricted file types and sizes

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (320px - 767px)

## 🎨 UI/UX Features

- **Modern Design**: Clean and intuitive interface
- **Dark Theme**: Professional dark color scheme
- **Animations**: Smooth transitions and hover effects
- **Toast Notifications**: Real-time feedback for user actions
- **Loading States**: Visual feedback during API calls
- **Form Validation**: Real-time input validation
- **Modal Dialogs**: Elegant popup interfaces

## 📈 Analytics & Reporting

The admin dashboard provides:
- User registration statistics
- Event popularity metrics
- Registration trends over time
- Category-wise event distribution
- Feedback analysis
- Real-time data visualization with charts

## 🔧 Development Tools

- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Nodemon**: Development server auto-restart
- **React DevTools**: Component debugging
- **MongoDB Compass**: Database management

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the production version: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Configure environment variables

### Backend Deployment (Heroku/Railway)
1. Set up environment variables
2. Configure MongoDB connection string
3. Deploy the backend folder
4. Update CORS settings for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Frontend Development**: React.js, UI/UX Design
- **Backend Development**: Node.js, API Design
- **Database Design**: MongoDB Schema Design
- **DevOps**: Deployment and Configuration

## 📞 Support

For support and questions:
- Email: contact@hackafest.com
- Phone: +91 9966885544
- Address: 123 Hackathon Street, Mangaluru City, IN 575006

## 🙏 Acknowledgments

- React.js community for excellent documentation
- MongoDB for robust database solutions
- Bootstrap team for responsive design framework
- All contributors and testers

---

**Built with ❤️ for the hackathon community**
```

