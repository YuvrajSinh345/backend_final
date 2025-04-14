const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
require('dotenv').config();

// Unified environment variable for MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || process.env.mongoURI || 'mongodb://localhost:27017/margdarshak';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
        console.log("Connected to DB at:", MONGODB_URI);
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1); // Exit with failure
    }
};

// Export the connection function
module.exports.connectDB = connectDB;

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [20, 'Username cannot exceed 20 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    userId: ObjectId 
    // firstName: String,
    // lastName: String,
}, {
    timestamps: true
});

const adminSchema = new Schema({
    username: { type: String, unique: true },
    password: String,
    firstName: String,
    lastName: String,
});
const productSchema = new Schema({
    title: String,
    description: String,
    price: Number,
    imageURL: String,
    sellerId: ObjectId,
});
const purchaseSchema = new Schema({
    userId: ObjectId,
    productId: ObjectId,
});

const userModal = mongoose.model("User", userSchema);
const adminModal = mongoose.model("admin", adminSchema);
const productModal = mongoose.model("product", productSchema);
const purchaseModal = mongoose.model("purchase", purchaseSchema);

// Export everything
module.exports = {
    connectDB,
    userModal,
    adminModal,
    productModal,
    purchaseModal
};