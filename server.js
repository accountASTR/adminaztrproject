const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch'); // Ensure you have node-fetch installed
const app = express();

const apiUrl = process.env.REACT_APP_API_URL;

// CORS Setup
app.use(cors({ origin: 'https://adminaztrproject-b332c3269318.herokuapp.com' }));

// Middleware to serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// Example: Fetch data from Laravel backend (runs server-side)
app.get('/api/test', async (req, res) => {
  try {
    const response = await fetch(`${apiUrl}/endpoint`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    console.log('Fetched data:', data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('App is listening on port ' + port);
});
