import React from 'react';
import './Calendar.css';

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
    <div className="calendar-container">
      <h1 className="calendar-title">Weekly Calendar</h1>
      <div className="calendar-main">
        {/* Header row: timeline spacer + day names */}
        <div className="calendar-header" style={{ height: `${dayHeaderHeight}px` }}>
          <div className="calendar-timeline-spacer"></div>
          <div className="calendar-day-names">
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                className={`calendar-day-name ${index === currentDayIndex ? 'active' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
        {/* Main grid: timeline & day columns */}
        <div className="calendar-grid">
          {/* Timeline column with hourly labels */}
          <div className="calendar-timeline">
            {hours.map((hour, index) => {
              const topPercent = (index / 24) * 100;
              return (
                <div
                  key={hour}
                  className="calendar-timeline-label"
                  style={{ top: `calc(${topPercent}% + ${timelineOffset}px)` }}
                >
                  {hour}
                </div>
              );
            })}
          </div>
          {/* Day columns */}
          <div className="calendar-days">
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                className={`calendar-day-column ${index === currentDayIndex ? 'active' : ''}`}
              >
                {/* Placeholder for future events */}
              </div>
            ))}
            {/* Red horizontal line indicating current time */}
            <div
              className="calendar-current-line"
              style={{ top: `${redLinePositionPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
