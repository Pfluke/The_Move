import React from 'react';

const Calendar = () => {
  // days of week
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  
  // get current day
  const currentDayIndex = new Date().getDay();

  return (
    <div style={{ padding: '20px', height: '100vh', boxSizing: 'border-box' }}>
      <h1>Calendar</h1>
      {/* Flex container to hold day columns */}
      <div style={{ display: 'flex', height: 'calc(100% - 60px)' }}>
        {daysOfWeek.map((day, index) => (
          <div
            key={day}
            style={{
              flex: 1,
              border: '1px solid #ddd',
              margin: '2px',
              padding: '10px',
              backgroundColor: index === currentDayIndex ? '#e6f7ff' : '#fff',
              // You can add more styling as needed
            }}
          >
            <h2 style={{ textAlign: 'center' }}>{day}</h2>
            {/* Placeholder for future event list */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
