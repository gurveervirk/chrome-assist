import React, { useState, useEffect } from 'react';
import { Box, TextField, IconButton, Select, MenuItem, Tooltip, Typography, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { loadSettings, saveSettings } from "../../api/settingsStorage";

const QuestionBox = ({ compose, closeBox, enhanceQuery }) => {
  const [question, setQuestion] = useState("");
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true); // Track loading state

  // Load settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      const storedSettings = await loadSettings();
      const filteredSettings = Object.keys(storedSettings)
        .filter(key => key !== "detect")
        .reduce((obj, key) => {
          obj[key] = storedSettings[key];
          return obj;
        }, {});
      setSettings(filteredSettings);
      console.log('Settings:', filteredSettings); // Log the settings
      setLoading(false); // Mark loading as complete
    };
    fetchSettings();
  }, []);

  const handleSubmit = async () => {
    if (question.trim()) {
      await saveSettings(settings);
      compose(question);
      setQuestion("");
    }
  };

  const handleEnhanceQuery = () => {
    if (question.trim()) {
      enhanceQuery({ text: question });
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
