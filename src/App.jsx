/* global chrome */

import React, { useState, useEffect, createContext, useMemo } from "react";
import { MemoryRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import Settings from "./components/ui/Settings";
import OutputBox from "./components/ui/OutputBox";
import QuestionBox from "./components/ui/QuestionBox";
import Bookmark from './components/ui/Bookmark';
import Navbar from './components/ui/Navbar';
import Home from './components/ui/Home';
import { Divider, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

const AppContent = ({ isGenerating, setIsGenerating, isBookmarking, setIsBookmarking, setError }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Add message listeners
    const messageListener = (message) => {
      if (message.command === "loading-output") {
        setIsGenerating(true);
        navigate('/output');
      }
      else if (message.command === "output-ready"){
        setIsGenerating(false);
      }
      else if (message.command === "loading-bookmark"){
        setIsBookmarking(true);
        navigate('/bookmarks');
      }
      else if(message.command === "bookmark-ready"){
        setIsBookmarking(false);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Clean up message listeners on unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleQuestionSubmit = async (question, tone = null, length = null) => {
    setIsGenerating(true);
    navigate('/output');
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ command: "generate", question, tone, length }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      console.log("Question response:", response);
    } catch (error) {
      console.error("Error during question submission:", error);
      setError("Failed to submit the question.");
    } finally {
      setIsGenerating(false);
    }
  };

  const enhanceQuery = async (message) => {
    console.log("enhanceQuery message received");
    setIsGenerating(true);
    navigate('/output');
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ command: "enhance-query", text: message }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    } catch (error) {
      console.error("Error during query enhancement:", error);
      setError("Failed to enhance the query.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTriggerRewrite = async (message, messageID = null, messageType = null) => {
    setIsGenerating(true);
    navigate('/output');
    try {
      const response = new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ command: "rewrite", text: message, id: messageID, type: messageType }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      console.log("Rewrite response:", response);
    } catch (error) {
      console.error("Error during rewriting:", error);
      setError("Failed to rewrite the text.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center mx-auto p-3">
      <Navbar isGenerating={isGenerating} isBookmarking={isBookmarking} />
      <Divider className="w-full mt-3" />
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/settings"
            element={
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                <Settings />
              </motion.div>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                <Bookmark isBookmarking={isBookmarking} setIsBookmarking={setIsBookmarking}/>
              </motion.div>
            }
          />
          <Route
            path="/write"
            element={
              <motion.div
                key="question"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <QuestionBox
                  compose={handleQuestionSubmit}
                  enhanceQuery={enhanceQuery}
                />
              </motion.div>
            }
          />
          <Route
            path="/output"
            element={
              <motion.div
                key="output"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%' }}
              >
                <OutputBox
                  handleTriggerRewrite={handleTriggerRewrite}
                  isGenerating={isGenerating}
                />
              </motion.div>
            }
          />
          <Route path="/" element={<Home />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState('light');
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={{ ...colorMode, mode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            isBookmarking={isBookmarking}
            setIsBookmarking={setIsBookmarking}
            setError={setError}
            colorMode={colorMode}
            theme={theme}
          />
        </Router>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}