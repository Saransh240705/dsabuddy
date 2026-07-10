import express from "express";
import passport from "passport";

const ALLOWED_ORIGINS = new Set([
  "https://dsabuddy.xyz",
  "https://www.dsabuddy.xyz",
  "http://localhost:4173",
  "http://localhost:5173",
  process.env.FRONTEND_URL?.replace(/\/$/, ""),
].filter(Boolean));

const router = express.Router();

// Start Google Login
router.get(
  "/google",
  (req, res, next) => {
    const referer = req.headers.referer || process.env.FRONTEND_URL || "http://localhost:5173";
    let origin = "http://localhost:5173";
    try {
      origin = new URL(referer).origin;
    } catch (e) {
      console.error("Failed to parse referer in OAuth setup:", e);
    }
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: origin,
      session: false,
    })(req, res, next);
  }
);

// Google Callback
router.get("/google/callback", (req, res, next) => {
  const rawState = req.query.state || "";
  const defaultOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
  const state = ALLOWED_ORIGINS.has(rawState) ? rawState : defaultOrigin;
  
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err || !user) {
      const errMsg = err?.message || "";
      const errCode = errMsg.includes("NSUT") || errMsg.includes("academic") ? "email_not_allowed" : "auth_failed";
      return res.redirect(`${state}/login?error=${errCode}`);
    }

    const token = user.token;
    if (!token) {
      return res.redirect(`${state}/login?error=auth_token_missing`);
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
    });

    const needsOnboarding = !user.branch;
    const targetPath = needsOnboarding ? "/onboarding" : "/dashboard";
    return res.redirect(`${state}${targetPath}`);
  })(req, res, next);
});

// Failed login
router.get("/fail", (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/login?error=email_not_allowed`);
});

// Logout — clear the JWT cookie (auth is stateless, so there's no session to destroy)
router.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
  });
  const redirectUrl = req.headers.referer || process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(redirectUrl);
});



export default router;
