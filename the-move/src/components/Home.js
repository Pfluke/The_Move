import React, { useState } from 'react';
import './Home.css'; 

const Home = () => {
  const [groups, setGroups] = useState([]); // manage list of groups
  const [showAddGroupCard, setShowAddGroupCard] = useState(false); // control visibility of add group card
  const [newGroupName, setNewGroupName] = useState(''); // store group name input

  const handleAddGroup = () => { // functino to handle adding new group
    if (newGroupName.trim()) { // check field of new group input is not empty
      const newGroup = {
        id: groups.length + 1, // ID based on num groups
        name: newGroupName, 
      };
      setGroups([...groups, newGroup]); // add new group
      setNewGroupName(''); // clear input field 
      setShowAddGroupCard(false); // hide add group card
    }
  };

  const handleKeyDown = (e) => { // press enter key in input field to create group
    if (e.key === 'Enter') {
      handleAddGroup();
    }
  };

  return ( 
    <div className="home-container">
      <h1>Groups</h1>
      <div className="groups-grid">
        {groups.map((group) => (
          <div key={group.id} className="group-card">
            <h2>{group.name}</h2>
          </div>
        ))}
        {showAddGroupCard ? (
          <div className="group-card add-group-card">
            <input
              type="text"
              placeholder="Enter group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={handleKeyDown} 
              autoFocus
            />
            <button onClick={handleAddGroup}>Add</button>
            <button onClick={() => setShowAddGroupCard(false)}>Cancel</button>
          </div>
        ) : (
          <div className="group-card add-group-placeholder" onClick={() => setShowAddGroupCard(true)}>
            <span>+ Add Group</span>
          </div>
        )}
      </div>
      <button className="floating-plus-button" onClick={() => setShowAddGroupCard(true)}>
        +
      </button>
    </div>
  );
};

export default Home;