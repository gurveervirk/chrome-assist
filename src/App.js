/* global chrome */

import { useState, useEffect, createContext, useMemo } from "react";
import { MemoryRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import { promptSummarizeModel } from "./api/summarizeHandler";
import { handleTranslation } from "./api/translateHandler";
import { handleWrite } from "./api/writeHandler";
import { handleRewrite, enhanceSearchQueries } from "./api/rewriteHandler";
import { saveBookmark, deleteBookmark, saveOutput } from "./utils/db"; // Import IndexedDB functions
import Settings from "./components/ui/Settings";
import OutputBox from "./components/ui/OutputBox";
import QuestionBox from "./components/ui/QuestionBox";
import Bookmark from './components/ui/Bookmark';
import Navbar from './components/ui/Navbar';
import Home from './components/ui/Home';
import { Divider, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from 'uuid';
import Readability from "@mozilla/readability";

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

const AppContent = ({ isGenerating, setIsGenerating, isBookmarking, setIsBookmarking, setError, colorMode, theme }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const extractMainContent = (doc) => {
      try{
        console.log("doc: ", doc);
        const reader = new Readability(doc.cloneNode(true));
        const article = reader.parse();
      
        return article?.textContent || null;
      }
      catch (error) {
        console.error("Error extracting main content using Readability:", error);
        return null;
      }
    };

    const handleTriggerSummarize = async (message) => {
      console.log("handleTriggerSummarize message received");
      setIsGenerating(true);
      navigate('/output');
      try {
        // Attempt to extract main content using Readability
        const mainContent = extractMainContent(message.html);
        const textToSummarize = mainContent || message.text; // Fallback to plain text

        const result = await promptSummarizeModel(textToSummarize, false);
        const outputData = {
          id: uuidv4(),
          input: textToSummarize,
          text: result,
          timestamp: new Date().toISOString(),
          type: 'Summary',
        };
        await saveOutput(outputData);
      } catch (error) {
        console.error("Error during summarization:", error);
        setError("Failed to summarize the text.");
      } finally {
        setIsGenerating(false);
      }
    };

    const handleSummarizeBookmark = async (message) => {
      console.log("handleSummarizeBookmark message received");
      setIsBookmarking(true);
      navigate('/bookmarks');
      try {
        const mainContent = extractMainContent(message.html);
        const textToSummarize = mainContent || message.text; // Fallback to plain text

        const result = await promptSummarizeModel(textToSummarize, true); // Summarize as a bookmark
        const bookmarkData = {
          id: uuidv4(),
          bookmarkID: message.bookmarkID,
          url: message.bookmarkURL,
          favicon: message.faviconURL,
          ...result,
        };
        await saveBookmark(bookmarkData);
        console.log("Bookmark summary saved:", bookmarkData);
      } catch (error) {
        console.error("Error saving bookmark summary:", error);
        setError("Failed to save bookmark summary.");
      }
      setIsBookmarking(false);
    };

    const handleDeleteBookmark = async (message) => {
      console.log("handleDeleteBookmark message received");
      try {
        await deleteBookmark(message.bookmarkID);
        console.log("Bookmark deleted with ID:", message.bookmarkID);
      } catch (error) {
        console.error("Error deleting bookmark:", error);
        setError("Failed to delete bookmark.");
      }
    };

    const handleTriggerWrite = async (message) => {
      console.log("handleTriggerWrite message received");
      navigate('/output');
      try {
        const mainContent = extractMainContent(message.html);
        const textToWrite = mainContent || message.text;

        const result = await handleWrite(textToWrite);
        const outputData = {
          id: uuidv4(),
          input: textToWrite,
          text: result,
          timestamp: new Date().toISOString(),
          type: 'Composition',
        };
        await saveOutput(outputData);
      } catch (error) {
        console.error("Error during writing:", error);
        setError("Failed to write the text.");
      }
    };

    const handleTriggerRewrite = async (message) => {
      console.log("handleTriggerRewrite message received");
      setIsGenerating(true);
      navigate('/output');
      try {
        const mainContent = extractMainContent(message.html);
        const textToRewrite = mainContent || message.text;

        const result = await handleRewrite(textToRewrite);
        const outputData = {
          id: uuidv4(),
          input: textToRewrite,
          text: result,
          timestamp: new Date().toISOString(),
          type: 'Composition',
        };
        await saveOutput(outputData);
      } catch (error) {
        console.error("Error during rewriting:", error);
        setError("Failed to rewrite the text.");
      } finally {
        setIsGenerating(false);
      }
    };

    const handleTriggerTranslate = async (message) => {
      console.log("handleTriggerTranslate message received");
      setIsGenerating(true);
      navigate('/output');
      try {
        const mainContent = extractMainContent(message.html);
        const textToTranslate = mainContent || message.text;

        const result = await handleTranslation(textToTranslate, "en");
        const outputData = {
          id: uuidv4(),
          input: textToTranslate,
          text: result,
          timestamp: new Date().toISOString(),
          type: 'Translation',
        };
        await saveOutput(outputData);
      } catch (error) {
        console.error("Error during translation:", error);
        setError("Failed to translate the text.");
      } finally {
        setIsGenerating(false);
      }
    };

    // Add message listeners
    const messageListener = (message) => {
      switch (message.command) {
        case "trigger-summarize":
          handleTriggerSummarize(message);
          break;
        case "summarize-bookmark":
          handleSummarizeBookmark(message);
          break;
        case "delete-bookmark":
          handleDeleteBookmark(message);
          break;
        case "trigger-translate":
          handleTriggerTranslate(message);
          break;
        case "trigger-write":
          handleTriggerWrite(message);
          break;
        case "trigger-rewrite":
          handleTriggerRewrite(message);
          break;
        default:
          console.error("Unknown command:", message.command);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Clean up message listeners on unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [navigate, setIsGenerating, setIsBookmarking, setError]);

  const handleQuestionSubmit = async (question, tone = null, length = null) => {
    setIsGenerating(true);
    navigate('/output');
    try {
      const result = await handleWrite(question, tone, length);
      const outputData = {
        id: uuidv4(),
        input: question,
        text: result,
        timestamp: new Date().toISOString(),
        type: 'Composition'
      };
      await saveOutput(outputData);
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
      const searchQuery = message.text;
      const enhancedQueries = await enhanceSearchQueries(searchQuery);
      const outputData = {
        id: uuidv4(),
        input: searchQuery,
        text: enhancedQueries,
        timestamp: new Date().toISOString(),
        type: 'Search'
      };
      await saveOutput(outputData);
    } catch (error) {
      console.error("Error during query enhancement:", error);
      setError("Failed to enhance the query.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTriggerRewrite = async (message, messageID = null, messageType = null) => {
    console.log("handleTriggerRewrite message received");
    setIsGenerating(true);
    navigate('/output');
    try {
      const result = await handleRewrite(message.text);
      const outputData = {
        id: messageID || uuidv4(),
        input: message.text,
        text: result,
        timestamp: new Date().toISOString(),
        type: messageType || 'Composition'
      };
      await saveOutput(outputData);
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
                <Bookmark isBookmarking={isBookmarking}/>
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
        <Router>
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