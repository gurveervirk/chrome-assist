import React, { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemText, Collapse, Avatar, Typography, Divider, IconButton, Tooltip } from '@mui/material';
import { ExpandLess, ExpandMore, Link as LinkIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { fetchBookmarks, deleteBookmark } from '../../utils/db';
import LoadingMessage from './LoadingMessage';
import { motion } from 'framer-motion';

const Bookmark = ({ isBookmarking }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [openSection, setOpenSection] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const data = await fetchBookmarks();
        setBookmarks(data);
      } catch (err) {
        setError('Failed to load bookmarks');
        console.error(err);
      }
    };

    loadBookmarks();
  }, []);

  useEffect(() => {
    console.log('isBookmarking', isBookmarking);
    if (!isBookmarking) {
      const loadBookmarks = async () => {
        try {
          const data = await fetchBookmarks();
          setBookmarks(data);
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
      await deleteBookmark(id);
      const data = await fetchBookmarks();
      setBookmarks(data);
    } catch (err) {
      setError('Failed to delete bookmark');
      console.error(err);
    }
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

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
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
      {isBookmarking && <LoadingMessage isGenerating={isBookmarking} />}
      {error && (
        <Typography variant="body2" sx={{ color: 'red', textAlign: 'center', mb: 2 }}>
          {error}
        </Typography>
      )}
      {bookmarks.length === 0 ? (
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
          Nothing to see here 😊
        </Typography>
      ) : (
        <List sx={{ marginTop: "0px" }}>
          {bookmarks.map((bookmark) => (
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