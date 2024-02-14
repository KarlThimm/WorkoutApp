import React, { useEffect, useState } from 'react';
import './App.css';
// You can remove the logo import if you're not using it
// import logo from './logo.svg';

function App() {
  // State to store the message
  const [message, setMessage] = useState('');

  // Fetch the message from the backend on component mount
  useEffect(() => {
    fetch('/api/hello')
      .then(response => response.json())
      .then(data => setMessage(data.message));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        {/* You can remove the img tag if you're not using the React logo */}
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <p>{message}</p> {/* Display the fetched message */}
        {/* You can remove or comment out the link to Learn React */}
        {/* <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a> */}
      </header>
    </div>
  );
}

export default App;
