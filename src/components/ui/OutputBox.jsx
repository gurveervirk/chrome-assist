/* global chrome */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Tooltip, List, ListItem, ListItemText, MenuItem, Select, FormControl, InputLabel, Checkbox, Paper, InputBase, Divider } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import ClearIcon from '@mui/icons-material/Clear';
import SendIcon from '@mui/icons-material/Send';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingMessage from './LoadingMessage';
import DOMPurify from "dompurify";
import FlexSearch from "flexsearch";

const OutputBox = ({ handleTriggerRewrite, isGenerating }) => {
  const [copied, setCopied] = useState({});
  const [selectedTabs, setSelectedTabs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [error, setError] = useState(null);
  const [searchBoxVisible, setSearchBoxVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOutputs, setFilteredOutputs] = useState([]);
  const [settings, setSettings] = useState({});
  const [rewriteSettingsVisible, setRewriteSettingsVisible] = useState(null);

  const flexIndex = useRef(new FlexSearch.Document({
    tokenize: "full",
    document: {
      id: "id",
      store: ["input", "text"],
      index: ["input", "text"],
    },
  }));

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
      }
    };
    fetchSettings();    
  }, []);

  useEffect(() => {
    const loadOutputs = async () => {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ command: 'get-outputs' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            }
            else {
              resolve(response);
            }
          });
        });
        // Sanitize the HTML content
        response.forEach(output => {
          output.text = DOMPurify.sanitize(output.text);
        });
        setOutputs(response);
        setFilteredOutputs(response);

        // Add outputs to the FlexSearch index
        response.forEach((output) => {
          flexIndex.current.add({
            id: output.id,
            input: output.input.replace(/<[^>]*>?/gm, ''),
            text: output.text.replace(/<[^>]*>?/gm, ''),
          });
        });
      } catch (err) {
        setError('Failed to load outputs');
        console.error(err);
      }
    };
    
    loadOutputs();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredOutputs(outputs);
    } else {
      const results = flexIndex.current.search(searchQuery);
      let matchingOutputs = results.flatMap(result => 
        result.result.map(id => outputs.find(output => output.id === id))
      );
      matchingOutputs = [...new Set(matchingOutputs)]; // Remove duplicates
      setFilteredOutputs(matchingOutputs);
    }
  }, [searchQuery, outputs]);

  useEffect(() => {
    if (!isGenerating) {
      const loadOutputs = async () => {
        try {
          const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ command: 'get-outputs' }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              }
              else {
                resolve(response);
              }
            });
          });
          // Sanitize the HTML content
          response.forEach(output => {
            output.text = DOMPurify.sanitize(output.text);
          });
          setOutputs(response);
          setFilteredOutputs(response);

          // Add outputs to the FlexSearch index
          response.forEach((output) => {
            flexIndex.current.add({
              id: output.id,
              text: output.text,
            });
          });
        } catch (err) {
          setError('Failed to load outputs');
          console.error(err);
        }
      };

      loadOutputs();
    }
  }, [isGenerating]);

  const handleCopy = (text, id) => {
    // Clean text before copying
    text = text.replace(/<[^>]*>?/gm, '');
    navigator.clipboard.writeText(text);
    setCopied((prevCopied) => ({ ...prevCopied, [id]: true }));
    setTimeout(() => setCopied((prevCopied) => ({ ...prevCopied, [id]: false })), 2000);
  };

  const handleRewrite = (id) => {
    rewriteSettingsVisible === id ? setRewriteSettingsVisible(null) : setRewriteSettingsVisible(id);
  };

  const handleDelete = async (id) => {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ command: 'delete-output', id }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          }
          else {
            resolve(response);
          }
        });
      });
      setOutputs(outputs.filter(output => output.id !== id));
      setFilteredOutputs(filteredOutputs.filter(output => output.id !== id));
    } catch (err) {
      setError('Failed to delete output');
      console.error(err);
    }
  };

  const handleTabChange = (event) => {
    const value = event.target.value;
    setSelectedTabs(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSearch = async (query) => {
    try {
      const outputIDs = outputs.map(output => output.id);
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ command: 'search', query: query, ids: outputIDs}, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          }
          else {
            resolve(response);
          }
        });
      });
      // Order the outputs by response order
      const orderedOutputs = response.map(id => outputs.find(output => output.id === id));
      setOutputs(orderedOutputs);
      setFilteredOutputs(orderedOutputs);
    } catch (err) {
      setError('Failed to search outputs');
      setTimeout(() => setError(null), 3000);
      console.error(err);
    }
  };

  const openURL = (query) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    console.log(url);
    chrome.tabs.create({ url });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    handleSearch(searchQuery);
  };

  const renderOutput = (output) => {
    let content;
    if (output.type === 'Search') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(output.text, 'text/html');
      const listItems = doc.querySelectorAll('li');
      const queries = Array.from(listItems).map(item => item.textContent);

      content = (
        <List style={{ padding: 0 }}>
          {queries.map((query, index) => (
            <ListItem
              key={index}
              style={{
                marginBottom: '1rem',
                '&:hover': { backgroundColor: 'rgba(26, 115, 232, 0.1)' },
              }}
            >
              <ListItemText primary={query} />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 1,
                }}
              >
                <Tooltip title="Search">
                  <IconButton
                    edge="end"
                    aria-label="search"
                    onClick={(e) => openURL(query)}
                    style={{
                      color: '#1A73E8',
                    }}
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItem>
          ))}
        </List>
      );
    } else {
      content = (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{ __html: output.text }} />
      );
    }

    return (
      <motion.div
        key={output.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            position: 'relative',
            backgroundColor: 'background.default',
            color: 'text.primary',
            borderRadius: 2,
            p: 2,
            mt: 2,
            width: '100%',
            boxShadow: 3,
            border: '2px solid #1A73E8',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                background: 'linear-gradient(90deg, #4285F4, #EA4335)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'flex-end',
                lineHeight: 2,
              }}
            >
              {output.type}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
              }}
            >
              <Tooltip title={`Input: ${output.input}`}>
                <IconButton
                  sx={{
                    color: '#1A73E8',
                    padding: 0.5,
                  }}
                  aria-label="input"
                >
                  <InfoIcon fontSize='small'/>
                </IconButton>
              </Tooltip>
            {output.type !== 'Search' && (
              <>
                <Tooltip title="Copy to clipboard">
                  <IconButton
                    onClick={() => handleCopy(output.text, output.id)}
                    sx={{
                      color: copied[output.id] ? 'green' : '#1A73E8',
                      padding: 0.5,
                      transition: 'color 0.3s',
                    }}
                    aria-label="copy"
                  >
                    {copied[output.id] ? <CheckIcon fontSize='small'/> : <ContentCopyIcon fontSize='small'/>}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Rewrite">
                  <IconButton
                    onClick={() => handleRewrite(output.id)}
                    sx={{
                      color: '#1A73E8',
                      padding: 0.5,
                      '&:hover': { color: '#1558B0' },
                    }}
                    aria-label="rewrite"
                  >
                    {rewriteSettingsVisible === output.id ? <ClearIcon fontSize='small'/> : <AutorenewIcon fontSize='small'/>}
                  </IconButton>
                </Tooltip>
              </>
            )}
              <Tooltip title="Delete">
                <IconButton
                  onClick={() => handleDelete(output.id)}
                  sx={{
                    color: '#1A73E8',
                    padding: 0.5,
                    '&:hover': { color: 'red' },
                  }}
                  aria-label="delete"
                >
                  <DeleteIcon fontSize='small'/>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          {rewriteSettingsVisible === output.id && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: '0.25rem', gap: 0.1 }}>
              <InputLabel sx={{ fontSize: '0.4rem', color: '#888' }} id='rewrite-tone-select-label'>Tone</InputLabel>
              <Select
                labelId='rewrite-tone-select-label'
                value={settings["rewrite"]?.tone || ""}
                onChange={(e) => setSettings({ ...settings, "rewrite": { ...settings["rewrite"], tone: e.target.value } })}
                sx={{ mr: 0.1, minWidth: 75, fontSize: '0.7rem', height: '1rem' }}
                size="small"
              >
                {["as-is", "more-formal", "more-casual"].map((option) => (
                  <MenuItem key={option} value={option} sx={{ fontSize: '0.7rem' }}>
                    {option.charAt(0).toUpperCase() + option.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
              <InputLabel sx={{ fontSize: '0.4rem', color: '#888' }} id='rewrite-length-select-label'>Length</InputLabel>
              <Select
                labelId='rewrite-length-select-label'
                value={settings["rewrite"]?.length || ""}
                onChange={(e) => setSettings({ ...settings, "rewrite": { ...settings["rewrite"], length: e.target.value } })}
                sx={{ mr: 0.1, minWidth: 75, fontSize: '0.7rem', height: '1rem' }}
                size="small"
              >
                {["as-is", "shorter", "longer"].map((option) => (
                  <MenuItem key={option} value={option} sx={{ fontSize: '0.7rem' }}>
                    {option.charAt(0).toUpperCase() + option.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
              <InputLabel sx={{ fontSize: '0.4rem', color: '#888' }} id='rewrite-format-select-label'>Format</InputLabel>
              <Select
                labelId='rewrite-format-select-label'
                value={settings["rewrite"]?.format || ""}
                onChange={(e) => setSettings({ ...settings, "rewrite": { ...settings["rewrite"], format: e.target.value } })}
                sx={{ mr: 0.1, minWidth: 75, fontSize: '0.7rem', height: '1rem' }}
                size="small"
              >
                {["as-is", "plain-text", "markdown"].map((option) => (
                  <MenuItem key={option} value={option} sx={{ fontSize: '0.7rem' }}>
                    {option.charAt(0).toUpperCase() + option.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
              <IconButton
                variant="contained"
                color="primary"
                onClick={() => handleTriggerRewrite(output.text, output.id, output.type)}
                sx={{ padding: 0.1 }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          {content}
          <Typography variant="caption" sx={{ position: 'absolute', bottom: 8, right: 8, fontStyle: 'italic', color: '#888' }}>
            {new Date(output.timestamp).toLocaleString()}
          </Typography>
        </Box>
      </motion.div>
    );
  };

  const renderTabContent = () => {
    const tabOutputs = selectedTabs.length > 0 ? filteredOutputs.filter(output => selectedTabs.includes(output.type)) : filteredOutputs;

    if (tabOutputs.length === 0) {
      return (
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
          Nothing to see here 😊
        </Typography>
      );
    }

    return (
      <AnimatePresence>
        {filteredOutputs.map(renderOutput)}
      </AnimatePresence>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%', padding: 2, paddingTop: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          Output
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip
            title={searchBoxVisible ? 'Hide Search Box' : 'Show Search Box'}
          >
            <IconButton onClick={() => setSearchBoxVisible(!searchBoxVisible)}>
              {searchBoxVisible ? <ClearIcon /> : <SearchIcon />}
            </IconButton>
          </Tooltip>
          <FormControl variant="outlined" sx={{ minWidth: 120 }}>
            <InputLabel id="output-type-select-label">Output Type</InputLabel>
            <Select
              labelId="output-type-select-label"
              multiple
              value={selectedTabs}
              onChange={handleTabChange}
              renderValue={(selected) =>
                selected.length === 0 ? (
                  <Box
                    sx={{
                      color: 'rgba(0, 0, 0, 0.6)', // Placeholder-like style
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    All
                  </Box>
                ) : (
                  <Box
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {selected.join(', ')}
                  </Box>
                )
              }
              label="Output Type"
              sx={{
                fontSize: '0.875rem',
                width: '150px',
              }}
            >
              <MenuItem value="Summary" sx={{ fontSize: '0.875rem' }}>
                <Checkbox checked={selectedTabs.indexOf('Summary') > -1} />
                <ListItemText primary="Summary" />
              </MenuItem>
              <MenuItem value="Translation" sx={{ fontSize: '0.875rem' }}>
                <Checkbox checked={selectedTabs.indexOf('Translation') > -1} />
                <ListItemText primary="Translation" />
              </MenuItem>
              <MenuItem value="Composition" sx={{ fontSize: '0.875rem' }}>
                <Checkbox checked={selectedTabs.indexOf('Composition') > -1} />
                <ListItemText primary="Composition" />
              </MenuItem>
              <MenuItem value="Search" sx={{ fontSize: '0.875rem' }}>
                <Checkbox checked={selectedTabs.indexOf('Search') > -1} />
                <ListItemText primary="Search" />
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      {searchBoxVisible && (
        <Paper
          component="form"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            padding: '2px 4px',
            mt: '0.25rem',
            width: '100%',
            borderRadius: 2,
          }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Search Outputs"
            inputProps={{ 'aria-label': 'search outputs' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query
          />
          <IconButton
            aria-label="search"
            onClick={handleSearchSubmit}
            disabled={!searchQuery}
          >
            <SearchIcon />
          </IconButton>
          <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
          <IconButton
            aria-label="clear"
            disabled={!searchQuery} // Disable the button if searchQuery is empty
            onClick={() => {
              setSearchQuery(''); // Clear the search query
              const sortedOutputs = [...outputs].sort(
                (a, b) => b.timestamp - a.timestamp
              ); // Sort outputs by date in descending order
              setOutputs(sortedOutputs); // Update the sorted outputs
            }}
          >
            <ClearIcon />
          </IconButton>
        </Paper>      
      )}
      <Divider
        sx={{
          my: '0.5rem',
          mx: '0'
        }}
      />
      <Box sx={{ marginTop: 2 }}>
        {isGenerating && (
          <LoadingMessage isGenerating={isGenerating} />
        )}
        {error && (
          <Typography variant="body2" sx={{ color: 'red', textAlign: 'center', mb: 2 }}>
            {error}
          </Typography>
        )}
        {renderTabContent()}
      </Box>
    </Box>
  );
};

export default OutputBox;