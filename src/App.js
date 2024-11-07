/* global chrome */

import { useState, useEffect } from "react";
import { promptSummarizeModel } from "./api/summarizeHandler";
import { handleTranslation } from "./api/translateHandler";
import { handleWrite } from "./api/writeHandler";
import { handleRewrite } from "./api/rewriteHandler";
import Settings from "./components/ui/Settings";
import OutputBox from "./components/ui/OutputBox";
import LoadingMessage from "./components/ui/LoadingMessage";
import QuestionBox from "./components/ui/QuestionBox";
import { Button, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';

export default function App() {
  const [output, setOutput] = useState("");
  const [taskIndex, setTaskIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuestionBoxOpen, setIsQuestionBoxOpen] = useState(false);

  useEffect(() => {
    const handleTriggerSummarize = async (message) => {
      console.log("handleTriggerSummarize message received");
      setIsGenerating(true);
      setTaskIndex(0);
      const result = await promptSummarizeModel(message.text);
      setOutput(result);
      setIsGenerating(false);
    };

    const handleTriggerWrite = async (message) => {
      console.log("handleTriggerWrite message received");
      setTaskIndex(2);
      setIsQuestionBoxOpen(true);
    };
    
    const handleTriggerRewrite = async (message) => {
      console.log("handleTriggerRewrite message received");
      setTaskIndex(2);
      setIsGenerating(true);
      const result = await handleRewrite(message.text);
      setIsQuestionBoxOpen(true);
      setOutput(result);
      setIsGenerating(false);
    };

    const handleTriggerTranslate = async (message) => {
      console.log("handleTriggerTranslate message received");
      setTaskIndex(1);
      setIsGenerating(true);
      const result = await handleTranslation(message.text, "en");
      setOutput(result);
      setIsGenerating(false);
    };

    // Add message listeners
    const messageListener = (message) => {
      if (message.command === "trigger-summarize") {
        handleTriggerSummarize(message);
      } else if (message.command === "trigger-translate") {
        handleTriggerTranslate(message);
      } else if (message.command === "trigger-write") {
        handleTriggerWrite(message);
      } else if (message.command === "trigger-rewrite") {
        handleTriggerRewrite(message);
      } else {
        console.error("Unknown command:", message.command);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Clean up message listeners on unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleClearOutput = () => {
    setIsQuestionBoxOpen(false);
    setOutput("");
  };

  const handleQuestionSubmit = async (question) => {
    setIsGenerating(true);
    const result = await handleWrite(question);
    setOutput(result);
    setIsGenerating(false);
  };

  const handleTriggerRewrite = async (message) => {
    console.log("handleTriggerRewrite message received");
    setTaskIndex(2);
    setIsGenerating(true);
    const result = await handleRewrite(message.text);
    setIsQuestionBoxOpen(true);
    setOutput(result);
    setIsGenerating(false);
  }

  return (
    <div className="flex w-full flex-col items-center mx-auto p-3">
      <div className="flex w-full items-center justify-between">
        <Typography
          variant="h5"
          sx={{
            background: 'linear-gradient(90deg, #4285F4, #EA4335)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'flex-end',
            lineHeight: 2,
          }}
        >
          ChromeAssist
        </Typography>
        <Button
          variant="outlined"
          sx={{
            borderColor: '#1A73E8',
            color: 'transparent',
            '&:hover': {
              borderColor: '#1A73E8',
              backgroundColor: 'rgba(26, 115, 232, 0.1)',
            },
          }}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          {isSettingsOpen ? (
            <CloseIcon
              sx={{
                color: '#1A73E8'
              }}
            />
          ) : (
            <SettingsIcon
              sx={{
                color: '#1A73E8'
              }}
            />
          )}
        </Button>
      </div>

      <Divider className="w-full mt-1" />

      <AnimatePresence mode="wait">
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full mt-1"
          >
            <Settings
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full">
        <AnimatePresence mode="wait">
          {isQuestionBoxOpen && (
            <motion.div
              key="question"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="w-full mt-2"
            >
              <QuestionBox onSubmit={handleQuestionSubmit} />
            </motion.div>
          )}
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <LoadingMessage isGenerating={isGenerating} />
            </motion.div>
          ) : (
            output ? (
              <motion.div
                key="output"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <OutputBox output={output} onClear={handleClearOutput} taskIndex={taskIndex} handleTriggerRewrite={handleTriggerRewrite} />
              </motion.div>
            ) : (
              !isSettingsOpen && !isQuestionBoxOpen && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="w-full mt-2"
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: '#1A73E8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1.5,
                      textAlign: 'center',
                      marginBottom: 1,
                    }}
                  >
                    Welcome to ChromeAssist!
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      textAlign: 'center',
                      color: '#555',
                      lineHeight: 1.7,
                      maxWidth: '600px',
                      margin: '0 auto',
                      padding: '0 1rem',
                    }}
                  >
                    ChromeAssist leverages the power of AI directly in your browser to help with a variety of tasks: summarizing text, translating languages, writing, and rewriting content. 💬✨
                    <br /> <br />
                    Get started by configuring the task settings to your liking, and use the shortcuts to easily invoke them as you browse. Enjoy a seamless and efficient experience!
                  </Typography>

                </motion.div>
              )
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}