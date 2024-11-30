/* global chrome */

import React, { useState, useEffect } from 'react';
import { Box, TextField, IconButton, Select, MenuItem, Tooltip, Typography, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

const QuestionBox = ({ compose, closeBox, enhanceQuery }) => {
  const [question, setQuestion] = useState("");
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true); // Track loading state

  // Load settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ command: "get-settings" }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
        // Handle rejected promise
        if (response instanceof Error) {
          throw response;
        }
        setSettings(response);
      } catch (error) {
        console.error("Error fetching settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();    
  }, []);

  const handleSubmit = async () => {
    if (question.trim()) {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ command: "generate", question, settings }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      compose(question);
      setQuestion("");
    }
  };

  const handleEnhanceQuery = () => {
    if (question.trim()) {
      enhanceQuery(question);
    }
  };

  if (loading) {
    // Show a loading spinner while settings are being fetched
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh', // Adjust as needed
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        backgroundColor: 'background.default',
        padding: 2,
        borderRadius: 1,
        boxShadow: 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            background: 'linear-gradient(90deg, #4285F4, #EA4335)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'flex-end',
            lineHeight: 2,
          }}
        >
          Compose
        </Typography>
        <IconButton onClick={closeBox}>
          <CloseIcon />
        </IconButton>
      </Box>
      <TextField
        fullWidth
        multiline
        rows={4}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type your question here..."
        variant="outlined"
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Select
          value={settings["write"]?.tone || ""}
          onChange={(e) => setSettings({ ...settings, "write": { ...settings["write"], tone: e.target.value } })}
          sx={{ mr: 2 }}
        >
          {["formal", "neutral", "casual"].map((option) => (
            <MenuItem key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1).toLowerCase()}
            </MenuItem>
          ))}
        </Select>
        <Select
          value={settings["write"]?.length || ""}
          onChange={(e) => setSettings({ ...settings, "write": { ...settings["write"], length: e.target.value } })}
          sx={{ mr: 2 }}
        >
          {["short", "medium", "long"].map((option) => (
            <MenuItem key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1).toLowerCase()}
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Enhance Query">
            <IconButton onClick={handleEnhanceQuery}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Compose">
            <IconButton onClick={handleSubmit}>
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default QuestionBox;
