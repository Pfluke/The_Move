import React from 'react';

const Calendar = () => {
  // Days of the week
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  // Get current time details
  const now = new Date();
  const currentDayIndex = now.getDay();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const totalMinutes = 24 * 60;
  const redLinePositionPercent = (minutesSinceMidnight / totalMinutes) * 100;

  // Create hourly labels for timeline
  const hours = Array.from({ length: 24 }, (_, i) => {
    let label;
    if (i === 0) label = "12 AM";
    else if (i < 12) label = `${i} AM`;
    else if (i === 12) label = "12 PM";
    else label = `${i - 12} PM`;
    return label;
  });

  // Fixed height for the header row (day names)
  const dayHeaderHeight = 40; // in pixels

  // Constant offset to move timeline labels downward
  const timelineOffset = 10; // in pixels

  return (
    <div style={{
      fontFamily: 'sans-serif',
      padding: '10px',
      height: '100vh',
      boxSizing: 'border-box',
      backgroundColor: '#fafafa'
    }}>
      <h1 style={{
        textAlign: 'center',
        margin: '10px 0',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        Weekly Calendar
      </h1>
      <div style={{
        height: 'calc(100% - 60px)',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        overflow: 'hidden'
      }}>
        {/* Header row: timeline spacer + day names */}
        <div style={{
          display: 'flex',
          height: `${dayHeaderHeight}px`,
          borderBottom: '1px solid #ccc'
        }}>
          <div style={{
            width: '60px',
            borderRight: '1px solid #ccc'
          }}></div>
          <div style={{
            flex: 1,
            display: 'flex'
          }}>
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: index === currentDayIndex ? 'bold' : 'normal',
                  backgroundColor: index === currentDayIndex ? '#e6f7ff' : '#fff',
                  borderRight: index < daysOfWeek.length - 1 ? '1px solid #ccc' : 'none'
                }}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
        {/* Main grid: timeline & day columns */}
        <div style={{
          flex: 1,
          display: 'flex',
          position: 'relative'
        }}>
          {/* Timeline column with hourly labels */}
          <div style={{
            width: '60px',
            borderRight: '1px solid #ccc',
            position: 'relative',
            backgroundColor: '#f9f9f9'
          }}>
            {hours.map((hour, index) => {
              const topPercent = (index / 24) * 100;
              return (
                <div
                  key={hour}
                  style={{
                    position: 'absolute',
                    top: `calc(${topPercent}% + ${timelineOffset}px)`,
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    textAlign: 'right',
                    width: '100%',
                    paddingRight: '5px'
                  }}
                >
                  {hour}
                </div>
              );
            })}
          </div>
          {/* Day columns */}
          <div style={{
            flex: 1,
            display: 'flex',
            position: 'relative'
          }}>
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                style={{
                  flex: 1,
                  borderRight: index < daysOfWeek.length - 1 ? '1px solid #ccc' : 'none',
                  position: 'relative',
                  backgroundColor: index === currentDayIndex ? '#e6f7ff' : '#fff'
                }}
              >
                {/* Placeholder for future events */}
              </div>
            ))}
            {/* Red horizontal line indicating current time */}
            <div style={{
              position: 'absolute',
              top: `${redLinePositionPercent}%`,
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'red',
              zIndex: 2
            }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;




