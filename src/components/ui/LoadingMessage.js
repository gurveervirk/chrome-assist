import React, { useEffect, useState } from "react";
import { Typography, Box } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

const LoadingMessage = ({ isGenerating }) => {
  const [loadingMessage, setLoadingMessage] = useState("Generating response");

  useEffect(() => {
    const loadingMessages = [
      "Generating response",
      "Please wait a moment",
      "Processing your request",
      "Fetching the results",
      "Almost there",
    ];

    let messageIndex = 1;
    let interval;

    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingMessage(loadingMessages[messageIndex]);
        messageIndex = (messageIndex + 1) % loadingMessages.length;
      }, 2000);
    } else {
      setLoadingMessage("");
    }

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <Box
      sx={{
        backgroundColor: '#FFFFFF',
        color: '#1A73E8',
        borderRadius: 2,
        p: 2,
        mt: 2,
        width: '100%',
        boxShadow: 3,
        border: '2px solid #1A73E8',
      }}
    >
      <AnimatePresence mode="wait">
        {loadingMessage && (
          <motion.div
            key={loadingMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="body2"
              sx={{
                background: 'linear-gradient(90deg, #4285F4, #EA4335)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'flex-end',
                lineHeight: 2,
              }}
            >
              {loadingMessage}
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default LoadingMessage;
