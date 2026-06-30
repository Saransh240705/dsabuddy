import { useState } from "react";
import { Navbar } from "@/components/layout";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="bg-[#000000] min-h-screen pt-24 sm:pt-32 md:pt-40">
      <Navbar />
      {isLogin ? (
        <div className="flex flex-col justify-center items-center">
          <div className="w-full px-4 sm:px-6">
            <LoginForm />
          </div>
          <div className="w-full max-w-120 mt-6 mb-6 cursor-pointer mx-auto px-4 sm:px-6 group">
            <button onClick={() => setIsLogin(false)} className="w-full">
              <p className="text-[#6c7280] group-hover:text-[#35b9f1] transition-colors duration-200 w-full text-sm sm:text-base text-center">
                // Not a member? <span className="underline">Register here</span>
              </p>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center">
          <div className="w-full px-4 sm:px-6">
            <RegisterForm />
          </div>
          <div className="w-full max-w-120 mt-6 mb-6 cursor-pointer mx-auto px-4 sm:px-6 group">
            <button onClick={() => setIsLogin(true)} className="w-full">
              <p className="text-[#6c7280] group-hover:text-[#35b9f1] transition-colors duration-200 w-full text-sm sm:text-base text-center">
                // Already a member? <span className="underline">Login here</span>
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
