import React from 'react';
import { motion } from 'framer-motion';

const GlassmorphismCard = ({ 
  children, 
  className = '', 
  hover = true, 
  delay = 0,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={hover ? { 
        y: -5, 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : {}}
      className={`
        backdrop-blur-xl bg-white/10 
        border border-white/20 
        rounded-2xl shadow-2xl 
        hover:shadow-3xl hover:bg-white/15
        transition-all duration-300 ease-out
        relative overflow-hidden
        ${className}
      `}
      {...props}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Animated border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10" />
    </motion.div>
  );
};

export default GlassmorphismCard;