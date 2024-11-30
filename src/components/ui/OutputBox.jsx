/* global chrome */

import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip, List, ListItem, ListItemText, MenuItem, Select, FormControl, InputLabel, Checkbox, ListItemIcon } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingMessage from './LoadingMessage';
import DOMPurify from "dompurify";

const OutputBox = ({ handleTriggerRewrite, isGenerating }) => {
  const [copied, setCopied] = useState({});
  const [selectedTabs, setSelectedTabs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [error, setError] = useState(null);

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
      } catch (err) {
        setError('Failed to load outputs');
        console.error(err);
      }
    };
    
    loadOutputs();
  }, []);

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

  const handleRewrite = (text, id, type) => {
    console.log('Rewrite:', text, id, type);
    text = text.replace(/<[^>]*>?/gm, '');
    handleTriggerRewrite(text, id, type);
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
    } catch (err) {
      setError('Failed to delete output');
      console.error(err);
    }
  };

  const handleTabChange = (event) => {
    const value = event.target.value;
    setSelectedTabs(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSearch = (query) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    chrome.tabs.create({ url });
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
              button
              onClick={() => handleSearch(query)}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSearch(query);
                    }}
                    style={{
                      color: '#1A73E8',
                    }}
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
                {/* <Tooltip title="Copy to clipboard">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(output.text, output.id);
                    }}
                    sx={{
                      color: copied[output.id] ? 'green' : '#1A73E8',
                      padding: 0.5,
                      transition: 'color 0.3s',
                    }}
                    aria-label="copy"
                  >
                    {copied[output.id] ? <CheckIcon fontSize='small'/> : <ContentCopyIcon fontSize='small'/>}
                  </IconButton>
                </Tooltip> */}
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
            // textAlign: 'center',
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
                    onClick={() => handleRewrite(output.text, output.id, output.type)}
                    sx={{
                      color: '#1A73E8',
                      padding: 0.5,
                      '&:hover': { color: '#1558B0' },
                    }}
                    aria-label="rewrite"
                  >
                    <EditIcon fontSize='small'/>
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
          {content}
          <Typography variant="caption" sx={{ position: 'absolute', bottom: 8, right: 8, fontStyle: 'italic', color: '#888' }}>
            {new Date(output.timestamp).toLocaleString()}
          </Typography>
        </Box>
      </motion.div>
    );
  };

  const renderTabContent = () => {
    const filteredOutputs = selectedTabs.length > 0 ? outputs.filter(output => selectedTabs.includes(output.type)) : outputs;

    if (filteredOutputs.length === 0) {
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
    <Box sx={{ width: '100%', height: '100%', padding: 2 }}>
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