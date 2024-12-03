/* global chrome */
import React, { useState } from 'react';
import { Button, IconButton, InputBase, Typography, useTheme, Paper, CircularProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import PauseIcon from '@mui/icons-material/Pause';
import LoadingMessage from './LoadingMessage';

const Home = () => {
  const theme = useTheme();
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const handleVoiceInput = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';

    const startSound = new Audio('assets/voice-input.mp3');
    const endSound = new Audio('assets/voice-input.mp3');

    recognition.onstart = () => {
      console.log('Voice input started');
      setListening(true);
      startSound.play();
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Enable Voice Access by going to site settings in this chrome extensions settings.\nVoice input error:', event.error);
      setListening(false);
    };

    recognition.onend = () => {
      console.log('Voice input ended');
      setListening(false);
      endSound.play();
    };

    recognition.start();
  };

  const handleSubmit = async () => {
    setLoading(true);
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command: "assist", input: userInput }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    setOutput(response === null ? 'No response' : response);
    setLoading(false);
  };

  return (
    <div className="w-full flex items-center justify-center flex-col p-6">
      <Typography
        variant="h4"
        sx={{
          fontWeight: 'bold',
          color: theme.palette.primary.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1.5,
          textAlign: 'center',
          marginBottom: '1rem',
        }}
      >
        Welcome to ChromeAssist!
      </Typography>

      <Paper
        component="form"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.5rem',
          borderRadius: '8px',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 2,
          marginBottom: '1rem',
        }}
      >
        <InputBase
          placeholder="Type your query here..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          sx={{
            flex: 1,
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            borderRadius: '4px',
            backgroundColor: theme.palette.background.paper,
          }}
        />
        <IconButton
          onClick={handleVoiceInput}
          color="primary"
          disabled={listening || loading}
          sx={{
            padding: '10px',
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.light,
            '&:hover': {
              backgroundColor: theme.palette.primary.main,
            },
          }}
        >
          {listening ? <PauseIcon sx={{ color: theme.palette.background.paper }} /> : <MicIcon sx={{ color: theme.palette.background.paper }} />}
        </IconButton>
      </Paper>

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={loading || !userInput}
        sx={{
          marginY: '1rem',
          padding: '0.75rem 2rem',
          width: '100%',
          borderRadius: '30px',
          backgroundColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        }}
      >
        Ask
      </Button>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <CircularProgress size={24} color="primary" />
        </div>
      )}

      {!loading && output && (
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            marginTop: '1rem',
            textAlign: 'center',
            width: '100%',
            maxWidth: '600px',
            backgroundColor: theme.palette.background.default,
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: 2,
          }}
          dangerouslySetInnerHTML={{ __html: output }}
        />
      )}
    </div>
  );
};

export default Home;
