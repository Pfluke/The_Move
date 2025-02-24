import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './components/Home';
import Calendar from './components/Calendar';
import AddEvent from './components/AddEvent';
import Schedule from './components/Schedule';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} /> {/* default route to home */}
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/add-event" element={<AddEvent />} />
          <Route path="/schedule" element={<Schedule />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;