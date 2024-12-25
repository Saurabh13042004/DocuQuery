import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-center items-center p-4">
      <motion.div
        className="max-w-4xl w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="text-5xl sm:text-6xl font-bold mb-6 text-center"
          variants={itemVariants}
        >
          DocuQuery
        </motion.h1>
        <motion.p 
          className="text-xl sm:text-2xl mb-12 text-center text-gray-600"
          variants={itemVariants}
        >
          Intelligent document analysis powered by AI
        </motion.p>
        <motion.div 
          className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16"
          variants={itemVariants}
        >
          <Link
            to="/app"
            className="bg-black text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-800 transition duration-300 w-full sm:w-auto text-center"
          >
            Get Started
          </Link>
          <a
            href="#features"
            className="bg-white text-black px-8 py-3 rounded-full font-semibold text-lg border-2 border-black hover:bg-gray-100 transition duration-300 w-full sm:w-auto text-center"
          >
            Learn More
          </a>
        </motion.div>
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-8"
          variants={containerVariants}
        >
          {[
            { icon: '📄', title: 'PDF Upload', description: 'Easily upload and process PDF documents' },
            { icon: '🔍', title: 'Smart Queries', description: 'Ask questions using natural language' },
            { icon: '🤖', title: 'AI-Powered', description: 'Get answers powered by Gemini 1.5 Flash' },
            { icon: '💾', title: 'Efficient Storage', description: 'Secure document storage and retrieval' },
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-gray-50 p-6 rounded-lg"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingPage;

