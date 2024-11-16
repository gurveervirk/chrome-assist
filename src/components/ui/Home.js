import React from 'react';
import { Typography } from '@mui/material';

const Home = () => {
  return (
    <div className="w-full mt-2">
      <Typography
        variant="h6"
        sx={{
          fontWeight: 'bold',
          color: '#1A73E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1.5,
          textAlign: 'center',
          marginBottom: 1,
        }}
      >
        Welcome to ChromeAssist!
      </Typography>

      <Typography
        variant="body1"
        sx={{
          textAlign: 'center',
          color: '#555',
          lineHeight: 1.7,
          maxWidth: '600px',
          margin: '0 auto',
          padding: '0 1rem',
        }}
      >
        ChromeAssist leverages the power of AI directly in your browser to help with a variety of tasks: summarizing text, translating languages, writing, and rewriting content. 💬✨
        <br /> <br />
        Get started by configuring the task settings to your liking, and use the shortcuts to easily invoke them as you browse. Enjoy a seamless and efficient experience!
      </Typography>
    </div>
  );
};

export default Home;