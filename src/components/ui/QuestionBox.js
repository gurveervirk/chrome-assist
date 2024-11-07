import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const QuestionBox = ({ onSubmit }) => {
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    if (question.trim()) {
      onSubmit(question);
      setQuestion("");
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
          alignItems: 'center',
        }}
      >
        <TextField
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question here..."
          sx={{ mb: 2 }}
        />
        <IconButton
          onClick={handleSubmit}
          sx={{
            color: '#1A73E8',
            marginLeft: 1,
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
  );
};

export default QuestionBox;