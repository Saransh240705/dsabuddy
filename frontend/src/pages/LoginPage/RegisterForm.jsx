import { Button, Divider } from "@/components/common";
import { FormField, SocialButton } from "@/components/layout";
import GoogleLogo from "@/assets/google.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { authService } from "@/api/services";
import { useUserStore } from "@/store/useUserStore";
import { API_BASE_URL } from "@/config/constants";
import { getErrorMessage } from "@/utils";

export const RegisterForm = () => {
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);
  const [formData, setFormData] = useState({
    name: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    year: "",
  });

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);

  const UG_YEAR_PATTERN = /(?:^|[._-])ug(\d{2})/i;
  const PG_YEAR_PATTERN = /(?:^|[._-])pg(\d{2})/i;

  const deriveYear = (email) => {
    const emailStr = String(email || "");
    const ugMatch = emailStr.match(UG_YEAR_PATTERN);
    if (ugMatch) return String(2004 + parseInt(ugMatch[1], 10));
    const pgMatch = emailStr.match(PG_YEAR_PATTERN);
    if (pgMatch) return String(2002 + parseInt(pgMatch[1], 10));
    return null;
  };

  const emailEndsWithNsut = formData.email.toLowerCase().endsWith("@nsut.ac.in");
  const canParseYear = deriveYear(formData.email);
  const showManualYear = emailEndsWithNsut && !canParseYear;

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth/google`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.toLowerCase().endsWith("@nsut.ac.in")) {
      setError("Only NSUT email addresses (@nsut.ac.in) are allowed to register.");
      return;
    }

    if (showManualYear) {
      if (!formData.year.trim()) {
        setError("Please enter your graduation year.");
        return;
      }
      const parsed = parseInt(formData.year, 10);
      if (isNaN(parsed) || parsed < 2020 || parsed > 2100) {
        setError("Please enter a valid graduation year between 2020 and 2100.");
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password do not match");
      return;
    }
    try {
      setLoading(true);
      const res = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        userName: formData.userName,
        ...(showManualYear ? { year: formData.year } : {}),
      });
      setUser(res.user || res);
      navigate("/onboarding");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex justify-center items-center w-full">
      <div className="mt-6 sm:mt-10 w-full max-w-md border-t-primary border-t-2 p-6 sm:p-10 rounded-2xl bg-[#0D1117] border border-[#1F2937] mx-auto">
        <div className="w-full text-center mx-auto mb-6">
          <h2 className="font-normal italic text-white font-serif text-3xl">
            Create Account
          </h2>
          <p className="text-content text-sm mt-1">Initialize your profile to join the competition</p>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-500 font-semibold bg-red-950/40 p-3 rounded-lg border border-red-500/30">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mx-auto w-full flex flex-col justify-center items-center">
          <FormField label="Name" placeholder="enter_name" name="name" value={formData.name} onChange={handleChange} required />

          <FormField
            label="Username"
            placeholder="enter_username"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            required
          />

          <FormField
            label="Email Address"
            type="email"
            placeholder="enter_email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {showManualYear && (
            <FormField
              label="Graduation Year"
              type="text"
              placeholder="e.g. 2027"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
            />
          )}

          <div className="w-full flex flex-col sm:flex-row gap-4">
            <FormField
              label="Password"
              type="password"
              placeholder="******"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <FormField
              label="Confirm Password"
              type="password"
              placeholder="******"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" variant="accent" className="w-full text-sm sm:text-base mt-4 justify-center" disabled={loading}>
            {loading ? "Initializing..." : "Initialize Account"}
          </Button>
        </form>

        <Divider text="OR" className="mt-6 mb-6" />

        <SocialButton icon={GoogleLogo} text="Continue with Google" onClick={handleGoogleLogin} />
      </div>
    </div>
  );
};
