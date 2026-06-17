export const IconBox = ({ 
  icon: Icon, 
  variant = "primary",
  className = "" 
}) => {
  const variants = {
    primary: "bg-[#35b9f1]/15 text-[#35b9f1]",
    info: "bg-[#3B82F6]/15 text-[#60A5FA]",
    success: "bg-[#10B981]/15 text-[#34D399]",
    warning: "bg-[#F59E0B]/15 text-[#FBBF24]",
  };

  return (
    <div className={`w-fit rounded-full p-3 group-hover:scale-110 transition-all duration-300 ${variants[variant]} ${className}`}>
      <Icon className="h-6 w-6" />
    </div>
  );
};
