// src/Home.js
import React from 'react';
import './Home.css'; // Import the CSS for styling
import { useNavigate } from 'react-router-dom'; // Use useNavigate hook instead of useHistory

const Home = () => {
  const navigate = useNavigate(); // For navigation in React Router v6

  

  // Function to handle "Start Test" button click
  const handleStartTest = () => {
    // Here, we can check if the user is authenticated or not.
    // For now, let's simulate going to the dashboard.
    navigate('/dashboard'); // Redirect to Dashboard (if user is authenticated)
  };

  return (
    <div className="home-container">
      {/* Background Video */}
      <video autoPlay loop muted className="background-video">
        <source src="https://cdn.pixabay.com/video/2022/08/31/129716-745174979_large.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content on top of the video */}
      <div className="content">
        <h1>Welcome to ProveIT</h1>
        <p>Your gateway to online tests and learning!</p>
        <div className="cta-buttons">
          <button className="cta-btn" onClick={handleStartTest}>Start Test</button>
          <button className="cta-btn">Learn More</button>
          <button className="cta-btn" onClick={handleInterviewRecorder}>Interview Recorder</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
