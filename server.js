const express = require('express');
const path = require('path');
const app = express();
const apiUrl = process.env.REACT_APP_API_URL;

// Example of fetching data from your Laravel backend
fetch(`${apiUrl}/endpoint`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

  fetch(`${process.env.REACT_APP_API_URL}/data`)
  .then(response => response.json())
  .then(data => console.log(data)); // This runs on the frontend


// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Handles any requests that don't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log('App is listening on port ' + port);