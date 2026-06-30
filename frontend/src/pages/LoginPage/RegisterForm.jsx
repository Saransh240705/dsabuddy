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
  });

  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);

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
      <div className="mt-6 sm:mt-10 w-full max-w-md border-t-(--primary-color) border-t-2 p-6 sm:p-10 rounded-2xl bg-[#0D1117] border border-[#1F2937] mx-auto">
        <div className="w-full text-center mx-auto mb-6">
          <h2 className="font-normal italic text-white font-serif text-3xl">
            Create Account
          </h2>
          <p className="content-color text-sm mt-1">Initialize your profile to join the competition</p>
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
