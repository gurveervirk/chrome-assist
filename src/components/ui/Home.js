import React from 'react';
import { Typography, useTheme } from '@mui/material';

const Home = () => {
  const theme = useTheme();

  return (
    <div
      className="w-full h-full flex items-center justify-center mt-3"
    >
      <div>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.primary.main,
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
            color: theme.palette.text.secondary,
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
    </div>
  );
};

export default Home;