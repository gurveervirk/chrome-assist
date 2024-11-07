import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';

const OutputBox = ({ output, onClear, taskIndex, handleTriggerRewrite }) => {
  const [copied, setCopied] = useState(false);
  const plainTextOutput = output.replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML tags

  const handleCopy = () => {
    navigator.clipboard.writeText(plainTextOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  const handleRewrite = () => {
    onClear();
    handleTriggerRewrite(plainTextOutput);
  };

  const getTitle = () => {
    if (taskIndex === 0) return "Summary";
    if (taskIndex === 1) return "Translation";
    if (taskIndex === 2) return "Compose";
    return "Output";
  };

  return (
    <Box
      sx={{
        position: 'relative', // To allow positioning of icons
        backgroundColor: '#FFFFFF', // White background
        color: '#1A73E8', // Light blue text (Google's blue)
        borderRadius: 2,
        p: 2,
        mt: 2,
        width: '100%',
        boxShadow: 3,
        border: '2px solid #1A73E8', // Blue border (Google's blue)
        textAlign: 'center', // Center the content
      }}
    >
      {/* Button row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between', // Align title to the left and buttons to the right
          alignItems: 'center', // Center vertically
          gap: 1,
          mb: 1, // Space between buttons and content
        }}
      >
        <Typography
          variant="h5"
          sx={{
            background: 'linear-gradient(90deg, #4285F4, #EA4335)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'flex-end',
            lineHeight: 2,
          }}
        >
          {getTitle()}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
          }}
        >
          <IconButton
            onClick={handleCopy}
            sx={{
              color: copied ? 'green' : '#1A73E8',
              fontSize: '1rem', // Smaller button size
              padding: 0.5, // Smaller padding
              transition: 'color 0.3s',
              '@media (max-width: 600px)': { fontSize: '0.8rem' }, // Responsive size
            }}
            aria-label="copy"
          >
            {copied ? <CheckIcon /> : <ContentCopyIcon />}
          </IconButton>
            <IconButton
              onClick={handleRewrite}
              sx={{
                color: '#1A73E8',
                fontSize: '1rem', // Smaller button size
                padding: 0.5, // Smaller padding
                '&:hover': { color: '#1558B0' },
                '@media (max-width: 600px)': { fontSize: '0.8rem' }, // Responsive size
              }}
              aria-label="rewrite"
            >
              <EditIcon />
            </IconButton>
          <IconButton
            onClick={onClear}
            sx={{
              color: '#1A73E8',
              fontSize: '1rem', // Smaller button size
              padding: 0.5, // Smaller padding
              '&:hover': { color: '#1558B0' },
              '@media (max-width: 600px)': { fontSize: '0.8rem' }, // Responsive size
            }}
            aria-label="clear"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Output content */}
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{ __html: output }} />
    </Box>
  );
};

export default OutputBox;