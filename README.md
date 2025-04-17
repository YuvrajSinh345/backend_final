# Career Advisor - Backend API

This is the backend server for the Career Advisor AI platform, built with **Node.js** and **Express.js**. It provides RESTful API endpoints for resume analysis, skill extraction, and integration with Gemini AI for feedback.

## Features

- Upload and parse PDF resumes  
- Extract and match skills against a predefined dataset  
- Generate improvement tips using Gemini API  
- MongoDB for data storage (if configured)  
- Organized routing and middleware structure

## Project Structure



## Getting Started

### Prerequisites

- Node.js (LTS version)  
- npm (Node Package Manager)  

### Installation

1. Clone the repository:

git clone <repository-url>
cd backend_final-main

2. Install dependencies:

npm install

3. Create a .env file and configure it with the following keys:

PORT=5000
GEMINI_API_KEY=your_google_gemini_api_key

4. Run the server:

npm start

API Endpoints

Method	Endpoint	Description
POST	/upload		Upload a resume PDF
GET	/skills		Get matched skills
GET	/tips		Get Gemini-based improvement tips
