import React, { useState, useEffect } from "react";
import { loadSettings, saveSettings } from "../../api/settingsStorage"; // Import loadSettings and saveSettings
import { MenuItem, Button, Select, Slider, TextField, FormControl, InputLabel, Typography } from "@mui/material";

const Settings = ({ isOpen, onClose }) => {
  const [currentTab, setCurrentTab] = useState("prompt"); // Default to "prompt"
  const [settings, setSettings] = useState({}); // State for settings
  const [isSaving, setIsSaving] = useState(false); // State to manage saving process

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
  };

  const renderSetting = (key, value) => {
    const displayName = displayNames[key] || key;
    if(key === "selectedLanguage") return null;
    if (key === "context") {
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
    setIsSaving(true);
    await saveSettings(settings); // Save the settings
    setIsSaving(false); // Reset the saving state
    onClose(); // Close the settings menu after saving
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <FormControl fullWidth className="mb-4">
        <Typography variant="h6" sx={{
          fontWeight: 'bold',
          marginBottom: '1rem',
        }}>
          Select Functionality
        </Typography>
        <Select value={currentTab} onChange={handleTabChange}>
          {/* Dropdown for selecting functionality */}
          {Object.keys(settings).map((tab) => (
            <MenuItem key={tab} value={tab}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} {/* Capitalize the tab name */}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <hr className="my-4" />

      {settings[currentTab] && Object.entries(settings[currentTab]).map(([key, value]) => {
        if (key !== "available") {
          return renderSetting(key, value);
        }
        return null;
      })}

      <div className="flex justify-end mt-4">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={isSaving} // Disable while saving
        >
          {isSaving ? "Saving..." : "Save"} {/* Change button text based on saving state */}
        </Button>
      </div>
    </div>
  );
};

export default Settings;