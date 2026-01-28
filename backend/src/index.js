import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { prisma } from "./config/prismaClient.js";
import routes from "./routes/index.js";
import session from "express-session";
import passport from "passport";
import authRoutes from "./routes/authRoutes.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import emailRoutes from "./routes/emailRoutes.js";
import userRoutes from "./routes/user.routes.js";
import companyRoutes from "./routes/company.routes.js";
import questionRoutes from "./routes/question.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import userQuestionRoutes from "./routes/userQuestion.routes.js";
import dailyActivityRoutes from "./routes/dailyActivity.routes.js";
import platformConnectionRoutes from "./routes/platformConnection.routes.js";
import syncRoutes from "./routes/sync.routes.js";

dotenv.config();

const app = express();

async function connectDatabases() {
  await prisma.$connect();
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/oauth/google/callback`,
      scope: ["profile", "email"],
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("Google Profile:", profile.displayName);
      return done(null, profile);
    }
  )
);

app.use("/api/auth", routes);
app.use("/api/oauth", authRoutes);
app.use('/api/email', emailRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/user-questions", userQuestionRoutes);
app.use("/api/daily-activity", dailyActivityRoutes);
app.use("/api/platform-connections", platformConnectionRoutes);
app.use("/api/sync", syncRoutes);

app.get("/", (req, res) => res.send("Server running"));

const PORT = process.env.PORT || 5000;
connectDatabases()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Failed to connect databases:", err);
    process.exit(1);
  });

