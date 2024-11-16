import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

const QuestionBox = ({ compose, closeBox, enhanceQuery }) => {
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    if (question.trim()) {
      compose(question);
      setQuestion("");
    }
  };

  const handleEnhanceQuery = () => {
    if (question.trim()) {
      enhanceQuery({ text: question });
    }
  };

  return (
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
          alignItems: 'flex-start',
        }}
      >
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question here..."
          sx={{ flexGrow: 1 }}
        />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: 1,
          }}
        >
          <IconButton
            onClick={closeBox}
            sx={{
              color: '#1A73E8',
              '&:hover': {
                color: '#1558B0',
              },
              marginBottom: 1,
            }}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <IconButton
            onClick={handleEnhanceQuery}
            sx={{
              color: '#1A73E8',
              '&:hover': {
                color: '#1558B0',
              },
              marginBottom: 1,
            }}
            aria-label="search"
          >
            <SearchIcon />
          </IconButton>
          <IconButton
            onClick={handleSubmit}
            sx={{
              color: '#1A73E8',
              '&:hover': {
                color: '#1558B0',
              },
            }}
            aria-label="submit"
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default QuestionBox;