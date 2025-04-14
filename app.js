const express = require("express");
const http = require('http');
const { connectDB } = require("./db.js");
const userRouter = require("./routes/user.js");
const quizRouter = require("./routes/quiz.js");
const careerRouter = require("./routes/path.js");
const chatRouter = require("./routes/chat.js");
const resumeRouter = require('./routes/resume');

const app = express();
const cors = require("cors");

app.use(cors()); // Replace with your frontend's URL
app.use(express.json());

// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/quiz", quizRouter);
app.use("/api/v1/path", careerRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/resume", resumeRouter);

// Initialize the server
const startServer = async () => {
    try {
        await connectDB(); // Wait for database connection
        app.listen(3001, () => {
            console.log("Server is running on port 3001");
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();