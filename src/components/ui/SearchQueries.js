/* global chrome */

import React, { useEffect, useState } from 'react';
import { Typography, IconButton, List, ListItem, ListItemText } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchQueries = ({ searchQueries }) => {
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    // Parse the HTML string to extract the text content of each list item
    const parser = new DOMParser();
    const doc = parser.parseFromString(searchQueries, 'text/html');
    const listItems = doc.querySelectorAll('li');
    const extractedQueries = Array.from(listItems).map(item => item.textContent);
    setQueries(extractedQueries);
  }, [searchQueries]);

  const handleSearch = (query) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    chrome.tabs.create({ url });
  };

  return (
    <div style={{ width: '100%', height: '100%', padding: 0, margin: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Typography
          variant="body1"
          style={{
            background: 'linear-gradient(90deg, #4285F4, #EA4335)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'flex-end',
            lineHeight: 2,
          }}
        >
          Enhanced Queries
        </Typography>
      </div>

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
    </div>
  );
};

export default SearchQueries;