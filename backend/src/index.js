import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import routes from "./routes/index.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"], // Your frontend URL
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use(authMiddleware);
app.use("/api", routes);

// Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
