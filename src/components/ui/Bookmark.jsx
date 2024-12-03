/* global chrome */

import React, { useState, useEffect, useRef } from 'react';
import { Box, List, ListItem, ListItemText, Collapse, Avatar, Typography, Divider, IconButton, Tooltip, Paper, InputBase } from '@mui/material';
import { ExpandLess, ExpandMore, Link as LinkIcon, Delete as DeleteIcon, Bookmark as BookmarkIcon } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { m, motion } from 'framer-motion';
import DOMPurify from "dompurify";
import LoadingMessage from './LoadingMessage';
import FlexSearch from "flexsearch";

const Bookmark = ({ isBookmarking, setIsBookmarking }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [openSection, setOpenSection] = useState(null);
  const [error, setError] = useState(null);
  const [searchBoxVisible, setSearchBoxVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);

  const flexIndex = useRef(new FlexSearch.Document({
    tokenize: "full",
    // charset: "latin:simple",
    // resolution: 9,
    document: {
      id: "id",
      store: ["title", "keywords", "tldr"],
      index: ["title", "keywords", "tldr"],
    },
    
  }));

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ command: "get-bookmarks" }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
        // Check for error response
        if (response.error) {
          setError(response.error);
          setTimeout(() => setError(null), 3000);
          return;
        }
        // Sanitize the HTML content
        response.forEach(bookmark => {
          bookmark.title = DOMPurify.sanitize(bookmark.title);
          bookmark.keywords = DOMPurify.sanitize(bookmark.keywords);
          bookmark.tldr = DOMPurify.sanitize(bookmark.tldr);
        });
        setBookmarks(response);
        setFilteredBookmarks(response);

        // Add bookmarks to FlexSearch index
        response.forEach(bookmark => {
          flexIndex.current.add({
            id: bookmark.id,
            title: bookmark.title.replace(/<[^>]*>?/gm, ''),
            keywords: bookmark.keywords.replace(/<[^>]*>?/gm, ''),
            tldr: bookmark.tldr.replace(/<[^>]*>?/gm, ''),
          });
        });
      } catch (err) {
        setError('Failed to load bookmarks');
        console.error(err);
      }
    };
    loadBookmarks();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredBookmarks(bookmarks);
    } else {
      const results = flexIndex.current.search(searchQuery);
      let matchingBookmarks = results.flatMap(result => 
        result.result.map(id => bookmarks.find(bookmark => bookmark.id === id))
      );
      matchingBookmarks = [...new Set(matchingBookmarks)]; // Remove duplicates
      setFilteredBookmarks(matchingBookmarks);
    }
  }, [searchQuery, bookmarks]);

  useEffect(() => {
    if (!isBookmarking) {
      const loadBookmarks = async () => {
        try {
          const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ command: "get-bookmarks" }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            });
          });
          // Check for error response
          if (response.error) {
            setError(response.error);
            setTimeout(() => setError(null), 3000);
            return;
          }
          // Sanitize the HTML content
          response.forEach(bookmark => {
            bookmark.title = DOMPurify.sanitize(bookmark.title);
            bookmark.keywords = DOMPurify.sanitize(bookmark.keywords);
            bookmark.tldr = DOMPurify.sanitize(bookmark.tldr);
          });
          setBookmarks(response);
          setFilteredBookmarks(response);

          // Add bookmarks to FlexSearch index
          response.forEach(bookmark => {
            flexIndex.current.add({
              id: bookmark.id,
              title: bookmark.title,
              keywords: bookmark.keywords,
              tldr: bookmark.tldr,
            });
          });
        } catch (err) {
          setError('Failed to load bookmarks');
          console.error(err);
        }
      };
      loadBookmarks();
    }
  }, [isBookmarking]);

  const handleClick = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  const handleDelete = async (id) => {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ command: "delete-bookmark", id }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      setBookmarks(bookmarks.filter(bookmark => bookmark.id !== id));
      setFilteredBookmarks(filteredBookmarks.filter(bookmark => bookmark.id !== id));
    } catch (err) {
      setError('Failed to delete bookmark');
      console.error(err);
    }
  };

  const handleBookmark = async () => {
    setIsBookmarking(true);
    try {
      const result = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ command: "bookmark" }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      if (result && 'response' in result && result.response === 'Bookmark already exists') {
        setError('Bookmark already exists');
        setTimeout(() => setError(null), 3000);
        setIsBookmarking(false);
        return;
      }
    } catch (err) {
      setError('Failed to bookmark the page');
      setTimeout(() => setError(null), 3000);
      console.error(err);
    }
    setIsBookmarking(false);
  };

  const parseKeywords = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const listItems = doc.querySelectorAll('li');
    return Array.from(listItems).map(item => item.textContent).join(', ');
  };

  const parseTitle = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.querySelector('p')?.textContent || '';
  };

  const handleSearch = async (query) => {
    try {
      const bookmarkIDs = bookmarks.map(bookmark => bookmark.id);
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ command: "search", query: query, ids: bookmarkIDs }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      // Order the bookmarks by response order
      const sortedBookmarks = response.map(id => bookmarks.find(bookmark => bookmark.id === id));
      setFilteredBookmarks(sortedBookmarks);
    } catch (err) {
      setError('Failed to search bookmarks');
      setTimeout(() => setError(null), 3000);
      console.error(err);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', padding: 2, paddingTop: 0}}>
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
          Bookmarks
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Bookmark Current Page">
            <IconButton 
              onClick={handleBookmark}
              sx={{
                '&:hover': { color: '#1A73E8' },
              }}
              disabled={isBookmarking}
            >
              <BookmarkIcon />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={searchBoxVisible ? 'Hide Search Box' : 'Show Search Box'}
          >
            <IconButton onClick={() => setSearchBoxVisible(!searchBoxVisible)}>
              {searchBoxVisible ? <ClearIcon /> : <SearchIcon />}
            </IconButton>
          </Tooltip>
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
            placeholder="Search Bookmarks"
            inputProps={{ 'aria-label': 'search bookmarks' }}
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
        </Paper>      
      )}
      <Divider
        sx={{
          my: '0.5rem',
          mx: '0'
        }}
      />
      {isBookmarking && <LoadingMessage isGenerating={isBookmarking} />}
      {error && (
        <Typography variant="body2" sx={{ color: 'red', textAlign: 'center', mb: 2 }}>
          {error}
        </Typography>
      )}
      {filteredBookmarks.length === 0 ? (
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
          Nothing to see here 😊
        </Typography>
      ) : (
        <List sx={{ marginTop: "0px", padding: "0px" }}>
          {filteredBookmarks.map((bookmark) => (
            <motion.div
              key={bookmark.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ListItem button onClick={() => handleClick(bookmark.id)} sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={bookmark.favicon} alt="Favicon" sx={{ width: 24, height: 24, marginRight: 1 }} />
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: "0.6rem", display: 'flex', alignItems: 'center' }}>
                      {parseTitle(bookmark.title)}
                    </Typography>
                  }
                />
                <Tooltip title={bookmark.url}>
                  <IconButton
                    component="a"
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ marginLeft: 1, display: 'flex', alignItems: 'center' }}
                  >
                    <LinkIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Bookmark">
                  <IconButton onClick={() => handleDelete(bookmark.id)} sx={{ marginLeft: 1, display: 'flex', alignItems: 'center' }}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
                {openSection === bookmark.id ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={openSection === bookmark.id} timeout="auto" unmountOnExit>
                <Box sx={{ padding: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {parseTitle(bookmark.title)}
                  </Typography>
                  {bookmark.keywords && (
                    <span>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        <strong>Keywords:</strong> {parseKeywords(bookmark.keywords)}
                      </Typography>
                    </span>
                  )}
                  {bookmark.tldr && (
                    <span>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body1" gutterBottom>
                        <strong>Summary:</strong> {bookmark.tldr}
                      </Typography>
                    </span>
                  )}
                </Box>
              </Collapse>
            </motion.div>
          ))}
        </List>
      )}
    </Box>
  );
};

export default Bookmark;