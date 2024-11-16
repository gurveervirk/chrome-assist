/* global chrome */

import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip, List, ListItem, ListItemText, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info'; // Import InfoIcon
import { fetchOutputs, deleteOutput } from '../../utils/db';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingMessage from './LoadingMessage';

const OutputBox = ({ handleTriggerRewrite, isGenerating }) => {
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Summary');
  const [outputs, setOutputs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOutputs = async () => {
      try {
        const data = await fetchOutputs();
        setOutputs(data);
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
          const data = await fetchOutputs();
          setOutputs(data);
        } catch (err) {
          setError('Failed to load outputs');
          console.error(err);
        }
      };

      loadOutputs();
    }
  }, [isGenerating]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRewrite = (text) => {
    handleTriggerRewrite(text);
  };

  const handleDelete = async (id) => {
    try {
      await deleteOutput(id);
      setOutputs(outputs.filter(output => output.id !== id));
    } catch (err) {
      setError('Failed to delete output');
      console.error(err);
    }
  };

  const handleTabChange = (event) => {
    setSelectedTab(event.target.value);
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
            backgroundColor: '#FFFFFF',
            color: '#1A73E8',
            borderRadius: 2,
            p: 2,
            mt: 2,
            width: '100%',
            boxShadow: 3,
            border: '2px solid #1A73E8',
            textAlign: 'center',
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
              <IconButton
                onClick={() => handleCopy(output.text)}
                sx={{
                  color: copied ? 'green' : '#1A73E8',
                  padding: 0.5,
                  transition: 'color 0.3s',
                }}
                aria-label="copy"
              >
                {copied ? <CheckIcon fontSize='small'/> : <ContentCopyIcon fontSize='small'/>}
              </IconButton>
              <IconButton
                onClick={() => handleRewrite(output.text)}
                sx={{
                  color: '#1A73E8',
                  padding: 0.5,
                  '&:hover': { color: '#1558B0' },
                }}
                aria-label="rewrite"
              >
                <EditIcon fontSize='small'/>
              </IconButton>
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
    const filteredOutputs = outputs.filter(output => output.type === selectedTab);

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
            value={selectedTab}
            onChange={handleTabChange}
            label="Output Type"
            sx={{ fontSize: '0.875rem' }}
          >
            <MenuItem value="Summary" sx={{ fontSize: '0.875rem' }}>Summary</MenuItem>
            <MenuItem value="Translation" sx={{ fontSize: '0.875rem' }}>Translation</MenuItem>
            <MenuItem value="Composition" sx={{ fontSize: '0.875rem' }}>Composition</MenuItem>
            <MenuItem value="Search" sx={{ fontSize: '0.875rem' }}>Search</MenuItem>
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