/* global chrome */

import React, { useState, useEffect } from "react";
import { MenuItem, IconButton, Select, Slider, TextField, FormControl, Typography, Box, Divider, InputLabel } from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';

const Settings = () => {
  const [currentTab, setCurrentTab] = useState("prompt"); // Default to "prompt"
  const [settings, setSettings] = useState({}); // State for settings
  const [saved, setSaved] = useState(false); // State to manage saved icon

  // Load settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ command: "get-settings" }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      setSettings(response);
    };
    fetchSettings();
  }, []);

  // Function to handle dropdown selection change
  const handleTabChange = (event) => {
    setCurrentTab(event.target.value);
  };

  // Mapping of keys to display names
  const displayNames = {
    languageMapping: "Preferred Language",
    temperature: "Temperature",
    topK: "Top K",
    type: "Type",
    format: "Format",
    length: "Length",
    tone: "Tone",
    context: "Context",
    titlePrompt: "Title Prompt",
    keywordsPrompt: "Keywords Prompt",
    numKeywords: "Number of Keywords",
    prompt: "Prompt",
    numQueries: "Number of Queries",
  };

  const renderSetting = (key, value) => {
    const displayName = displayNames[key] || key;
    if(key === "selectedLanguage") return null;
    if (key === "context" || key === "titlePrompt" || key === "keywordsPrompt" || key === "prompt") {
      return (
        <div key={key} className="mb-4">
          <Typography variant="body1" className="block mb-2" style={{ fontWeight: 'bold' }}>{displayName}</Typography>
          <TextField
            multiline
            value={value}
            onChange={(e) => {
              const updatedSettings = { ...settings, [currentTab]: { ...settings[currentTab], [key]: e.target.value } };
              setSettings(updatedSettings);
            }}
            fullWidth
          />
        </div>
      );
    } else if (typeof value === "number") {
      const [min, max] = settings[currentTab].available[key];
      const step = (min === 0 && max === 1) ? 0.05 : 1;
      return (
        <div key={key} className="mb-4">
          <Typography variant="body1" className="block mb-2" style={{ fontWeight: 'bold' }}>{displayName}</Typography>
          <Slider
            min={min}
            max={max}
            value={value}
            step={step}
            valueLabelDisplay="auto"
            onChange={(e, newValue) => {
              const updatedSettings = { ...settings, [currentTab]: { ...settings[currentTab], [key]: newValue } };
              setSettings(updatedSettings);
            }}
            fullWidth
          />
        </div>
      );
    } else if ((settings[currentTab]?.available && Array.isArray(settings[currentTab].available[key]))) {
      return (
        <div key={key} className="mb-4">
          <Typography variant="body1" className="block mb-2" style={{ fontWeight: 'bold' }}>{displayName}</Typography>
          <FormControl fullWidth>
            <Select
              value={value}
              onChange={(e) => {
                const updatedSettings = { ...settings, [currentTab]: { ...settings[currentTab], [key]: e.target.value } };
                setSettings(updatedSettings);
              }}
            >
              {settings[currentTab].available && settings[currentTab].available[key].map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      );
    } else if (currentTab === "translate") {
      return (
        <div key={key} className="mb-4">
          <Typography variant="body1" className="block mb-2" style={{ fontWeight: 'bold' }}>Select Preferred Language</Typography>
          <FormControl fullWidth>
            <Select
              value={settings[currentTab].selectedLanguage}
              onChange={(e) => {
                const updatedSettings = { ...settings, [currentTab]: { ...settings[currentTab], selectedLanguage: e.target.value } };
                setSettings(updatedSettings);
              }}
            >
              {Object.entries(settings[currentTab].languageMapping).map(([code, name]) => (
                <MenuItem key={code} value={code}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      );
    }
    return null;
  };

  // Function to handle save action
  const handleSave = async () => {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command: "save-settings", settings }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    setSaved(true); // Set saved state to true
    setTimeout(() => setSaved(false), 2000); // Reset saved state after 2 seconds
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        padding: 2,
        paddingTop: 0,
        alignItems: 'center',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
          Settings
        </Typography>
        <IconButton
          color="primary"
          onClick={handleSave}
        >
          {saved ? <CheckIcon /> : <SaveIcon />} {/* Change icon based on saved state */}
        </IconButton>
      </Box>
      <FormControl 
        fullWidth
        sx={{
          my: '0.25rem'
        }}
      >
        <InputLabel id="task-type-select-label">Task Type</InputLabel>
        <Select 
          value={currentTab} 
          onChange={handleTabChange}
          labelId="task-type-select-label"
          label="Task Type"
        >
          {/* Dropdown for selecting functionality */}
          {Object.keys(settings).map((tab) => (
            <MenuItem key={tab} value={tab}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} {/* Capitalize the tab name */}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider
        sx={{
          my: '0.5rem',
          mx: '0'
        }}
      />

      {settings[currentTab] && Object.entries(settings[currentTab]).map(([key, value]) => {
        if (key !== "available") {
          return renderSetting(key, value);
        }
        return null;
      })}
    </Box>
  );
};

export default Settings;