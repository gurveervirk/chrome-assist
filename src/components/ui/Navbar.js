import React, { useState, useEffect, useContext } from 'react';
import { Typography, IconButton, Tooltip, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';
import CreateIcon from '@mui/icons-material/Create';
import OutputIcon from '@mui/icons-material/Output';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ColorModeContext } from '../../App';

const Navbar = ({ isGenerating, isBookmarking }) => {
  const [hasUnreadOutput, setHasUnreadOutput] = useState(false);
  const [hasUnreadBookmark, setHasUnreadBookmark] = useState(false);
  const location = useLocation();
  const colorMode = useContext(ColorModeContext);

  useEffect(() => {
    if (isGenerating && location.pathname !== '/output') {
      setHasUnreadOutput(true);
    }
  }, [isGenerating]);

  useEffect(() => {
    if (isBookmarking && location.pathname !== '/bookmarks') {
      setHasUnreadBookmark(true);
    }
  }, [isBookmarking]);

  const handleOutputClick = () => {
    setHasUnreadOutput(false);
  };

  const handleBookmarkClick = () => {
    setHasUnreadBookmark(false);
  };

  return (
    <div className="flex w-full items-center justify-between">
      <Link to="/" style={{ textDecoration: 'none' }}>
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
          ChromeAssist
        </Typography>
      </Link>

      <div className="flex items-center">
        <Tooltip title="Toggle Theme">
          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
            {colorMode.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Output">
          <Box sx={{ position: 'relative' }}>
            <Link to="/output" onClick={handleOutputClick}>
              <IconButton
                sx={{
                  borderColor: '#1A73E8',
                  color: 'transparent',
                  '&:hover': { borderColor: '#1A73E8', backgroundColor: 'rgba(26, 115, 232, 0.1)' },
                  fontSize: 'small', // Reduce button size
                }}
              >
                <OutputIcon sx={{ color: '#1A73E8' }} />
              </IconButton>
            </Link>
            {hasUnreadOutput && (
              <PriorityHighIcon
                sx={{
                  color: 'red',
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  fontSize: 12,
                }}
              />
            )}
          </Box>
        </Tooltip>

        <Tooltip title="Write">
          <Link to="/write">
            <IconButton
              sx={{
                borderColor: '#1A73E8',
                color: 'transparent',
                '&:hover': { borderColor: '#1A73E8', backgroundColor: 'rgba(26, 115, 232, 0.1)' },
                fontSize: 'small', // Reduce button size
              }}
            >
              <CreateIcon sx={{ color: '#1A73E8' }} />
            </IconButton>
          </Link>
        </Tooltip>

        <Tooltip title="Bookmarks">
          <Box sx={{ position: 'relative' }}>
            <Link to="/bookmarks" onClick={handleBookmarkClick}>
              <IconButton
                sx={{
                  borderColor: '#1A73E8',
                  color: 'transparent',
                  '&:hover': { borderColor: '#1A73E8', backgroundColor: 'rgba(26, 115, 232, 0.1)' },
                  fontSize: 'small', // Reduce button size
                }}
              >
                <FolderIcon sx={{ color: '#1A73E8' }} />
              </IconButton>
            </Link>
            {hasUnreadBookmark && (
              <PriorityHighIcon
                sx={{
                  color: 'red',
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  fontSize: 12,
                }}
              />
            )}
          </Box>
        </Tooltip>

        <Tooltip title="Settings">
          <Link to="/settings">
            <IconButton
              sx={{
                borderColor: '#1A73E8',
                color: 'transparent',
                '&:hover': { borderColor: '#1A73E8', backgroundColor: 'rgba(26, 115, 232, 0.1)' },
                fontSize: 'small', // Reduce button size
              }}
            >
              <SettingsIcon sx={{ color: '#1A73E8' }} />
            </IconButton>
          </Link>
        </Tooltip>
      </div>
    </div>
  );
};

export default Navbar;