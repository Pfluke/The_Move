import React, { useState } from 'react';
import './AddEvent.css'; 

const AddEvent = () => {
  // state variables for each form field
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDetails, setEventDetails] = useState('');

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    if (eventName && eventDate && eventTime && eventLocation && eventDetails) { // check if all fields are filled
      // log data (replace with an api call or other logic)
      console.log({
        eventName,
        eventDate,
        eventTime,
        eventLocation,
        eventDetails,
      });

      // clear all fields after add successful
      setEventName('');
      setEventDate('');
      setEventTime('');
      setEventLocation('');
      setEventDetails('');

      // success msg if event added successfully 
      alert('Event added successfully!');
    } else {
      // if a field is empty
      alert('Please fill out all fields.');
    }
  };

  return (
    <div className="add-event-container">
      <h1>Add Event</h1>
      <form onSubmit={handleSubmit}>
        
        {/* event name field */}
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

        {/* event date field */}
        <div className="form-group">
          <label htmlFor="eventDate">Event Date:</label>
          <input
            type="date"
            id="eventDate"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </div>

        {/* event time field */}
        <div className="form-group">
          <label htmlFor="eventTime">Event Time:</label>
          <input
            type="time"
            id="eventTime"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            required
          />
        </div>

        {/* event location field */}
        <div className="form-group">
          <label htmlFor="eventLocation">Event Location:</label>
          <input
            type="text"
            id="eventLocation"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            required
          />
        </div>

        {/* event details field */}
        <div className="form-group">
          <label htmlFor="eventDetails">Event Details:</label>
          <textarea
            id="eventDetails"
            value={eventDetails}
            onChange={(e) => setEventDetails(e.target.value)}
            required
          />
        </div>

        {/* submit button */}
        <button type="submit" className="submit-button">
          Add Event
        </button>
      </form>
    </div>
  );
};

export default AddEvent;