const express = require("express");
const http = require('http');
const WebSocket = require('ws');
const userRouter = require("./routes/user.js");
const quizRouter = require("./routes/quiz.js");
const careerRouter = require("./routes/path.js");
const chatRouter = require("./routes/chat.js");
const trendsRouter = require('./routes/trends');
const resumeRouter = require('./routes/resume');
const app = express();
const cors = require("cors");
app.use(cors()); // Replace with your frontend's URL

app.use(express.json());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/quiz", quizRouter);
app.use("/api/v1/path", careerRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/trends", trendsRouter);
app.use("/api/v1/resume", resumeRouter);

app.listen(3001, () => {
    console.log("Server is running on port 3001");
});