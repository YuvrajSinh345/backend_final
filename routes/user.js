const express = require('express');
const bcrypt = require('bcrypt');
const { userModal } = require("../db.js");
const userRouter = express.Router();
const jwt = require('jsonwebtoken');
const userMiddleware = require('../middleware/userMiddleware.js');

const JWT_SECRET = process.env.JWT_SECRET;

userRouter.post("/signup", async function (req, res) {
    try {
        const { username, password } = req.body;
        
        console.log('Received signup request for username:', username);

        // Validate input
        if (!username || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ 
                success: false,
                message: "All fields (username, password) are required." 
            });
        }

        // Check username format
        if (username.length < 3 || username.length > 20) {
            console.log('Invalid username length');
            return res.status(400).json({
                success: false,
                message: "Username must be between 3 and 20 characters."
            });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            console.log('Invalid username format');
            return res.status(400).json({
                success: false,
                message: "Username can only contain letters, numbers, and underscores."
            });
        }

        // Check if username already exists
        console.log('Checking for existing username...');
        const existingUser = await userModal.findOne({ username });
        if (existingUser) {
            console.log('Username already exists');
            return res.status(400).json({ 
                success: false,
                message: "Username already exists. Please choose a different username." 
            });
        }

        // Hash password
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        console.log('Creating new user...');
        const newUser = new userModal({
            username: username,
            password: hashedPassword
        });

        await newUser.save();
        console.log('User created successfully');

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser._id, username: newUser.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Signup successful, sending response');
        res.status(201).json({
            success: true,
            message: "User registered successfully!",
            user: {
                id: newUser._id,
                username: newUser.username
            },
            token: token
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ 
            success: false,
            message: "Internal server error",
            error: err.message 
        });
    }
});

userRouter.post("/signin", async function (req, res) {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                message: "All fields (username, password) are required." 
            });
        }

        // Find user
        const user = await userModal.findOne({ username });
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid username or password." 
            });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid username or password." 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username
            },
            token: token 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false,
            message: "Internal server error",
            error: err.message 
        });
    }
});

// userRouter.get("/me", userMiddleware, async function(req , res){
    
//     try {

//         const user = await userModal.findById(req.user.id).select(" username ");

//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         res.status(200).json(user);
//     } catch (error) {
//         res.status(500).json({ error: "Internal server error" });
//     }
// })


// userRouter.post("/updateprofile", async function (req, res) {
//     const { firs̥tName, lastName, username, address } = req.body;
//     const updatedProfile = new userModal({
//         firstName: firstName,
//         lastName: lastName,
//         username: username,
//         address: address
//     });
//     await updatedProfile.update();
// })

module.exports = userRouter;