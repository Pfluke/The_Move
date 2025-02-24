import React, { useState } from 'react';
import './AddEvent.css'; 

const AddEvent = () => {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDetails, setEventDetails] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission (e.g., send data to an API or store it in state)
    console.log({
      eventName,
      eventDate,
      eventTime,
      eventLocation,
      eventDetails,
    });
    alert('Event added successfully!');
  };

  return (
    <div className="add-event-container">
      <h1>Add Event</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="eventName">Event Name:</label>
          <input
            type="text"
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventDate">Date:</label>
          <input
            type="date"
            id="eventDate"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventTime">Time:</label>
          <input
            type="time"
            id="eventTime"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventLocation">Location:</label>
          <input
            type="text"
            id="eventLocation"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventDetails">Details:</label>
          <textarea
            id="eventDetails"
            value={eventDetails}
            onChange={(e) => setEventDetails(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Add Event
        </button>
      </form>
    </div>
  );
};

export default AddEvent;