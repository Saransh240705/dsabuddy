import { motion } from "framer-motion";
import { Button } from "@/components/common";

export const CTASection = ({ onGetStarted = () => {} }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="xl:max-w-270 2xl:max-w-270 md:max-w-190 sm:max-w-150 max-w-90 m-auto mt-13 text-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_center,_rgba(53,185,241,0.08)_0%,_transparent_70%)] border border-[#1F2937] hover:border-[#35b9f1]/30 transition-all duration-300 rounded-3xl p-20 pb-10"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1 
          className="text-5xl font-Instrument-Serif font-normal italic text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Ready to get consistent with DSA?
        </motion.h1>
        
        <motion.h3 
          className="text-lg mt-6 font-Spline-Sans text-[#a1a1aa]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Track your progress, build streaks, and compete with classmates — all in one dashboard.
        </motion.h3>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button variant="primary" className="mt-8" onClick={onGetStarted}>
            Start Tracking DSA
          </Button>
        </motion.div>
        
        <motion.p 
          className="content-color mt-6 font-Spline-Sans"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          It's free
        </motion.p>
      </motion.div>
    </motion.div>
  );
};
