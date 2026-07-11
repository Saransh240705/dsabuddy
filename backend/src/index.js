import { authLimiter, apiLimiter } from "./middlewares/rateLimiter.js";
import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./config/prismaClient.js";
import routes from "./routes/index.js";
import passport from "passport";
import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "./controller/mailerController.js";
import userRoutes from "./routes/user.routes.js";
import companyRoutes from "./routes/company.routes.js";
import questionRoutes from "./routes/question.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import userQuestionRoutes from "./routes/userQuestion.routes.js";
import dailyActivityRoutes from "./routes/dailyActivity.routes.js";
import platformConnectionRoutes from "./routes/platformConnection.routes.js";
import syncRoutes from "./routes/sync.routes.js";
import forumRoutes from "./routes/forum.routes.js";
import leetcodeRoutes from "./routes/leetcode.routes.js";
import uploadRoutes from "./routes/upload.js";
import contactRoutes from "./routes/contact.routes.js";
import sheetRoutes from "./routes/sheet.routes.js";
import { pointsWorker } from "./queues/pointsWorker.js";
import { scheduleFanOutJob } from "./queues/pointsQueue.js";
import { deriveGraduationYearFromEmail } from "./utils/graduationYear.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

const allowedOrigins = new Set([
  "https://dsabuddy.xyz",
  "https://www.dsabuddy.xyz",
  "http://localhost:4173",
  "http://localhost:5173",
  process.env.FRONTEND_URL?.replace(/\/$/, ""),
].filter(Boolean));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(apiLimiter);
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Auth is stateless (JWT in an httpOnly cookie); Passport is only used for the
// Google OAuth handshake, so no session store is needed.
app.use(passport.initialize());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/oauth/google/callback`,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails || profile.emails.length === 0) {
          return done(new Error("No email found in Google profile"), null);
        }
        const email = profile.emails[0].value.toLowerCase();
        const parts = email.split('@');
        if (parts.length !== 2) {
          return done(new Error("Invalid email format"), null);
        }
        const domain = parts[1];
        const isAllowedEmail = 
          domain === "nsut.ac.in" || 
          domain === "dtu.ac.in" || 
          domain === "igdtuw.ac.in" || 
          domain.endsWith(".nsut.ac.in") || 
          domain.endsWith(".dtu.ac.in") || 
          domain.endsWith(".igdtuw.ac.in");

        if (!isAllowedEmail) {
          return done(new Error("Only NSUT, DTU, and IGDTUW email addresses are allowed."), null);
        }
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          let year = deriveGraduationYearFromEmail(email);
          if (!year) {
            year = "N/A";
          }
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.emails[0].value.split("@")[0],
              userName: `user_${profile.id}`,
              avatarUrl: profile.photos?.[0]?.value || null,
              year,
            },
          });
          // Send welcome email asynchronously
          sendWelcomeEmail(user.email, user.name).catch((error) => {
            console.error("Failed to send welcome email to", user.email, error);
          });
        }

        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            userName: user.userName,
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return done(null, { ...user, token });
      } catch (error) {
        console.error("Google Auth Error:", error);
        return done(error, null);
      }
    }
  )
);

app.use("/api/auth", authLimiter, routes);
app.use("/api/oauth", authLimiter, authRoutes);
app.use('/api/email', emailRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/user-questions", userQuestionRoutes);
app.use("/api/daily-activity", dailyActivityRoutes);
app.use("/api/platform-connections", platformConnectionRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/leetcode", leetcodeRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/sheets", sheetRoutes);

app.get("/", (req, res) => res.send("Server running"));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

scheduleFanOutJob().catch((err) => {
  console.error("Failed to schedule points fan-out job:", err.message);
});

process.on("SIGTERM", async () => {
  await pointsWorker.close();
});


