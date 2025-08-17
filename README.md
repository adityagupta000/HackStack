# Event Management System - HackStack

A comprehensive event management platform for organizing hackathons and technical events with seamless user experience.

## 🖼️ Application Screenshots

### 🏠 Main Interface

#### Welcome & Countdown
- Animated welcome message with typing effect
![Countdown Timer](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/Home.png)
- Live countdown timer and smooth transitions
![Countdown Timer](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/Countdown.png)

#### Event Management
- Complete event listings with status indicators
![Event List](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/Event_list.png)
- Detailed event view with registration integration
![Event Details](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/Detail_event.png)

### 🔐 Authentication

#### Login & Registration
- Clean login interface with floating labels
![Login Page](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/login.png)
- Registration with real-time validation
![Registration Page](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/Register.png)

#### Password Recovery
- Email-based recovery system
![Forgot Password](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/Forgot_password.png)
- Secure token-based password reset
![Reset Password](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/Reset_Password.png)

### 👤 User Dashboard

#### Personal Dashboard
![User Dashboard](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/User_dashboard.png)
- Registration statistics and upcoming events
- Event status tracking and receipt downloads
- Quick actions and achievement badges

#### Events & Calendar
- Interactive calendar with color-coded events
![User Calendar](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/User_calender.png)

#### User Feedback
![User Feedback](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/User_Feedback.png)
- Star rating and comment system
- Event review and suggestion submission

### 🔧 Admin Panel

#### Admin Dashboard & Statistics
![Admin Statistics](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/Admin_Stats.png)
- Real-time analytics with charts and metrics
- Performance indicators and trend analysis

#### User Management
![Admin User Management](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/Admin_User.png)
- User management with role assignment
- Bulk operations and user activity tracking

#### Event Creation
![Add Event](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/Add_Event.png)
- Event creation wizard with rich editor
- Image upload and category selection

#### Feedback Management
![Admin Feedback](https://github.com/adityagupta000/HackStack/blob/53ce21c07ad7d167bc2db5cd5a4af2e3a33cccfd/HackStack/Feedback.png)
- Feedback analysis with sentiment tracking
- Response management and moderation

## ✨ Key Features

### For Participants
- **Event Discovery**: Browse events by category with advanced search
- **One-Click Registration**: Instant registration with email confirmation
- **Digital Receipts**: PDF receipts with QR codes for verification
- **Personal Dashboard**: Track registrations and manage participation
- **Calendar Integration**: Sync with personal calendar apps
- **Feedback System**: Rate and review attended events
- **Mobile Access**: Full functionality on all devices

### For Administrators
- **Analytics Dashboard**: Real-time statistics and performance metrics
- **User Management**: Complete user control with role assignment
- **Event Creation**: Rich editor with media upload capabilities
- **Registration Tracking**: Monitor participants with detailed insights
- **Feedback Analysis**: Review and analyze user feedback
- **File Management**: Upload images, documents, and rule books
- **Communication Tools**: Send announcements to participants

### Technical Features
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Security**: JWT authentication with password encryption
- **Performance**: Fast loading with smooth interactions
- **File Upload**: Support for images and PDF documents
- **QR Integration**: Secure verification system
- **Email System**: Automated notifications and confirmations

## 🛠️ Technology Stack

**Frontend**: React.js, Bootstrap 5, Tailwind CSS, Axios, React Router
**Backend**: Node.js, Express.js, MongoDB, JWT, bcryptjs, Multer
**Features**: PDF generation, QR codes, Email notifications, File uploads

## 🚀 Getting Started

### Installation
1. Clone repository and install dependencies
2. Set up MongoDB database
3. Configure environment variables
4. Start backend server (Port 5000)
5. Start frontend application (Port 3000)

## 📊 API Endpoints

**Authentication**: Register, Login, Password Reset, Token Refresh
**Events**: CRUD operations, Category filtering, File uploads
**Registrations**: Event registration, Receipt generation, User tracking
**Admin**: Statistics, User management, Event oversight
**Verification**: QR code validation system

## 🔐 Security Features

- JWT Authentication with secure token management
- Password hashing with bcrypt encryption
- Rate limiting for API protection
- Input validation and sanitization
- CORS configuration for secure requests
- File upload restrictions and validation
