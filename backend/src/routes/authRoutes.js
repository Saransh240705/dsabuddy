import express from "express";
import passport from "passport";

const router = express.Router();

// Start Google Login
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/oauth/fail" }),
  (req, res) => {
    const token = req.user?.token;
    if (!token) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_token_missing`);
    }
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const needsOnboarding = !req.user?.branch || !req.user?.year;
    const targetPath = needsOnboarding ? "/onboarding" : "/dashboard";
    res.redirect(`${process.env.FRONTEND_URL}${targetPath}?token=${token}`);
  }
);

// Failed login
router.get("/fail", (req, res) => {
  res.send("❌ Failed to authenticate");
});

// Logout
router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect(process.env.FRONTEND_URL);
  });
});



export default router;
