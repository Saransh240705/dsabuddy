import { motion } from "framer-motion";

export const Card = ({ 
  children, 
  variant = "default",
  className = "",
  animated = true,
  delay = 0,
  ...props 
}) => {
  const variants = {
    default: "bg-[#161B22] text-white border border-[#1F2937] hover:border-[var(--primary-color)] hover:drop-shadow-lg",
    dark: "bg-[#161B22] border border-[#1F2937] text-white",
    accent: "bg-[#0D1117] text-white border border-[#1F2937] hover:border-[var(--primary-color)]",
    highlight: "bg-black text-white border border-[#1F2937] hover:border-[var(--primary-color)]",
  };

  const Component = animated ? motion.div : "div";
  const animationProps = animated ? {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5, delay },
    whileHover: { y: -5 },
  } : {};

  return (
    <Component
      className={`w-full h-full p-6 rounded-4xl group transition-all duration-300 ${variants[variant]} ${className}`}
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
};
