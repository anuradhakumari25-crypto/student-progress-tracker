import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((error) => console.log("MongoDB connection error:", error));

// Schema (validation ke saath)
const progressSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: [true, "Student name is required"],
        trim: true,
        maxlength: [50, "Student name must be 50 characters or less"]
    },
    courseName: {
        type: String,
        required: [true, "Course name is required"],
        trim: true,
        maxlength: [80, "Course name must be 80 characters or less"]
    },
    completionPercentage: {
        type: Number,
        required: [true, "Completion percentage is required"],
        min: [0, "Completion must be between 0 and 100"],
        max: [100, "Completion must be between 0 and 100"]
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

const Progress = mongoose.model("Progress", progressSchema);

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Common error handler
function handleError(res, error, fallbackMessage) {
    if (error.name === "ValidationError") {
        const message = Object.values(error.errors)[0].message;
        return res.status(400).json({ message });
    }
    if (error.name === "CastError") {
        return res.status(400).json({ message: "Invalid id or value" });
    }
    console.log(error);
    res.status(500).json({ message: fallbackMessage });
}

// CREATE
app.post("/progress", async (req, res) => {
    try {
        const { studentName, courseName, completionPercentage } = req.body;
        await Progress.create({ studentName, courseName, completionPercentage });
        res.status(201).json({ message: "Progress added successfully" });
    } catch (error) {
        handleError(res, error, "Error adding progress");
    }
});

// READ
app.get("/progress", async (req, res) => {
    try {
        const progress = await Progress.find();
        res.json(progress);
    } catch (error) {
        handleError(res, error, "Error getting progress");
    }
});

// UPDATE
app.put("/progress/:id", async (req, res) => {
    try {
        const { studentName, courseName, completionPercentage } = req.body;
        const updated = await Progress.findByIdAndUpdate(
            req.params.id,
            { studentName, courseName, completionPercentage, lastUpdated: new Date() },
            { new: true, runValidators: true }
        );
        if (!updated) {
            return res.status(404).json({ message: "Progress not found" });
        }
        res.json({ message: "Progress updated successfully" });
    } catch (error) {
        handleError(res, error, "Error updating progress");
    }
});

// DELETE
app.delete("/progress/:id", async (req, res) => {
    try {
        const deleted = await Progress.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Progress not found" });
        }
        res.json({ message: "Progress deleted successfully" });
    } catch (error) {
        handleError(res, error, "Error deleting progress");
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});