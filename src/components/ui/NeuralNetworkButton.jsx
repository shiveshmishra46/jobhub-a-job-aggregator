import React, { useState } from 'react';
import { motion } from 'framer-motion';

const NeuralNetworkButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  className = '',
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white',
    secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };

  return (
    <motion.button
      className={`
        relative overflow-hidden rounded-xl font-semibold
        transform transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-2xl
        focus:outline-none focus:ring-4 focus:ring-blue-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      disabled={loading}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {/* Neural network animation background */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={isHovered ? {
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={isHovered ? { x: '100%' } : { x: '-100%' }}
        transition={{ duration: 0.6 }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center">
        {loading && (
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {children}
      </span>
    </motion.button>
  );
};

export default NeuralNetworkButton;