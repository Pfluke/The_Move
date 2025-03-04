const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const groupSlices = {}; // Initialize an empty object to store slices for each group


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow any origin (change this in production)
    methods: ['GET', 'POST'],
  }
});

// Path to users.csv and groups.csv
const usersCsvFile = path.join(__dirname, 'users.csv');
const groupsCsvFile = path.join(__dirname, 'groups.csv');
const groupsCreatorCsvFile = path.join(__dirname, 'groupsCreator.csv'); // New CSV file for group creators
const slicesCsvFile = path.join(__dirname, 'slices.csv');

const ensureSlicesFileExists = () => {
  if (!fs.existsSync(slicesCsvFile)) {
    console.log(`File not found, creating new file: ${slicesCsvFile}`);
    fs.writeFileSync(slicesCsvFile, 'Group,Slice\n'); // Add headers
  }
};

// Read slices from CSV based on group name
const readSlicesFromCsv = (groupName) => {
  return new Promise((resolve, reject) => {
    ensureSlicesFileExists();
    const slices = [];
    fs.createReadStream(slicesCsvFile)
      .pipe(csv({ headers: ['Group', 'Slice'] }))
      .on('data', (row) => {
        if (row.Group === groupName) {
          slices.push(row.Slice.trim());
        }
      })
      .on('end', () => resolve(slices))
      .on('error', (err) => reject(err));
  });
};

// Ensure the CSV files exist with proper headers
const ensureFileExists = () => {
  if (!fs.existsSync(usersCsvFile)) {
    console.log(`File not found, creating new file: ${usersCsvFile}`);
    fs.writeFileSync(usersCsvFile, 'username,password\n'); // Add headers
  }

  if (!fs.existsSync(groupsCsvFile)) {
    console.log(`File not found, creating new file: ${groupsCsvFile}`);
    fs.writeFileSync(groupsCsvFile, 'Group,Member\n'); // Add headers
  }

  if (!fs.existsSync(groupsCreatorCsvFile)) {
    console.log(`File not found, creating new file: ${groupsCreatorCsvFile}`);
    fs.writeFileSync(groupsCreatorCsvFile, 'Group,Creator\n'); // Add headers
  }
};

// Read users from CSV file
const readUsersFromCsv = () => {
  return new Promise((resolve, reject) => {
    ensureFileExists();
    const users = {};
    fs.createReadStream(usersCsvFile)
      .pipe(csv({ headers: ['username', 'password'] }))
      .on('data', (row) => {
        if (row.username && row.password) {
          users[row.username.trim().toLowerCase()] = row.password.trim();
        }
      })
      .on('end', () => resolve(users))
      .on('error', (err) => reject(err));
  });
};

// Read groups from CSV file
const readGroupsFromCsv = () => {
  return new Promise((resolve, reject) => {
    ensureFileExists();
    const groups = {};
    fs.createReadStream(groupsCsvFile)
      .pipe(csv({ headers: ['Group', 'Member'] }))
      .on('data', (row) => {
        if (row.Group && row.Member) {
          if (!groups[row.Group]) {
            groups[row.Group] = [];
          }
          groups[row.Group].push(row.Member.trim().toLowerCase());
        }
      })
      .on('end', () => resolve(groups))
      .on('error', (err) => reject(err));
  });
};

// Save groups to CSV
const saveGroupsToCSV = (groups) => {
  let csvData = 'Group,Member\n';
  for (const group in groups) {
    groups[group].forEach(member => {
      csvData += `${group},${member}\n`;
    });
  }

  fs.writeFile(groupsCsvFile, csvData, (err) => {
    if (err) console.error('Error writing to CSV:', err);
    else console.log('Groups data saved to CSV');
  });
};

// Save group creators to CSV
const saveGroupsCreatorToCSV = (groupName, creator) => {
  const newGroupLine = `${groupName},${creator}\n`;
  fs.appendFile(groupsCreatorCsvFile, newGroupLine, (err) => {
    if (err) console.error('Error adding group creator to CSV:', err);
    else console.log(`Group creator information saved: ${groupName}, ${creator}`);
  });
};

// Write a new user to the CSV file
const createUserInCsv = (username, password) => {
  return new Promise((resolve, reject) => {
    const newUserLine = `${username},${password}\n`;
    fs.appendFile(usersCsvFile, newUserLine, (err) => {
      if (err) {
        console.error('Error adding new user to CSV:', err);
        reject(err);
      } else {
        console.log(`User ${username} created successfully`);
        resolve();
      }
    });
  });
};

// Get the creator of the group by group name
const getGroupCreator = async (groupName) => {
  try {
    const creators = await readGroupCreatorsFromCsv();
    const creator = creators[groupName];

    if (creator) {
      console.log(creator)
      return creator;
    } else {
      console.log(`Group '${groupName}' creator not found.`);
      return null; // or some default value
    }
  } catch (err) {
    console.error('Error reading group creator from CSV:', err);
    return null;
  }
};

// Read group creators from CSV file
const readGroupCreatorsFromCsv = () => {
  return new Promise((resolve, reject) => {
    ensureFileExists();
    const creators = {};
    fs.createReadStream(groupsCreatorCsvFile)
      .pipe(csv({ headers: ['Group', 'Creator'] }))
      .on('data', (row) => {
        if (row.Group && row.Creator) {
          creators[row.Group] = row.Creator.trim().toLowerCase();
        }
      })
      .on('end', () => resolve(creators))
      .on('error', (err) => reject(err));
  });
};

// Function to delete a group
const deleteGroup = async (groupName) => {
  try {
    let groups = await readGroupsFromCsv();
    let creators = await readGroupCreatorsFromCsv();

    if (!groups[groupName]) {
      console.log(`Group '${groupName}' does not exist.`);
      return { success: false, message: `Group '${groupName}' does not exist.` };
    }

    // Remove the group from the groups object
    delete groups[groupName];

    // Remove from the group creators file
    if (creators[groupName]) {
      delete creators[groupName];
    }

    // Remove the slices related to this group
    await deleteSlicesByGroup(groupName);

    // Save updated data back to CSV files
    saveGroupsToCSV(groups);
    saveGroupsCreatorToCSVFile(creators);

    console.log(`Group '${groupName}' deleted successfully.`);
    return { success: true, message: `Group '${groupName}' deleted successfully.` };
  } catch (error) {
    console.error('Error deleting group:', error);
    return { success: false, message: 'An error occurred while deleting the group.' };
  }
};

// Helper function to overwrite the group creator file after deletion
const saveGroupsCreatorToCSVFile = (creators) => {
  let csvData = 'Group,Creator\n';
  for (const group in creators) {
    csvData += `${group},${creators[group]}\n`;
  }

  fs.writeFile(groupsCreatorCsvFile, csvData, (err) => {
    if (err) console.error('Error writing to group creators CSV:', err);
    else console.log('Group creator data updated in CSV.');
  });
};

const getAllGroups = async () => {
  try {
    const groups = await readGroupsFromCsv();
    return groups;
  } catch (error) {
    console.error('Error retrieving all groups:', error);
    return {};
  }
};

const deleteSlicesByGroup = async (groupName) => {
  try {
    // Read the current slices from the CSV file
    const slices = await readSlicesFromCsv(groupName);

    // Filter out slices for the specified group
    const updatedSlices = slices.filter(slice => slice.group !== groupName);

    // Write the updated slices back to the CSV
    let csvData = updatedSlices.map(slice => `${slice.group},${slice.slice}`).join('\n') + '\n';
    await fs.promises.writeFile(slicesCsvFile, csvData);
    console.log(`Slices for group '${groupName}' deleted successfully.`);
  } catch (error) {
    console.error('Error deleting slices:', error);
  }
};



// Socket.io event handlers
io.on('connection', async (socket) => {
  console.log('A user connected');
  
  
  try {
    const groups = await readGroupsFromCsv(); // Load groups from CSV
    socket.emit('updateGroups', groups);  // Emit groups to the client
  } catch (err) {
    console.error('Error reading groups from CSV:', err);
  }

  // Handle requestGroups event from the client
  socket.on('requestGroups', async () => {
    console.log('Requesting all groups');
    const groups = await readGroupsFromCsv(); // Load groups from CSV

    // Send all groups data to the client
    if (groups) {
      socket.emit('updateGroups', groups);
    } else {
      console.log('Groups data is not available.');
      socket.emit('error', 'Could not fetch groups data');
    }
  });

  socket.on('getGroupCreatorInfo', async (groupName) => {
    console.log(`Fetching creator for group: ${groupName}`);
  
    try {
      const creator = await getGroupCreator(groupName);
      console.log(`fetch`)
      if (creator) {
        console.log(`creator: ${creator}`)
        socket.emit('groupCreatorInfo', { groupName: groupName, creator: creator });


      } else {
        socket.emit('groupCreatorInfo', `No creator found for group '${groupName}'`);
      }
    } catch (error) {
      console.error('Error getting group creator:', error);
      socket.emit('groupCreatorInfo', 'An error occurred while fetching the group creator');
    }
  });

  socket.on('requestSlices', async (groupName) => {
    // Fetch slices for the group from your data store or any logic
    const slices = await readSlicesFromCsv(groupName); // Some function that fetches slices
    socket.emit('updateSlices', slices);  // Emit the slices back to the client
  });
  

  // Event to receive slice names and group name
  // Event to receive slice names and group name
  socket.on('addSlices', async ({ groupName, slices }) => {
    console.log(`Received slices for group: ${groupName}`, slices);
  
    if (!Array.isArray(slices) || slices.length === 0) {
      console.error("Error: Slices is not a valid array", slices);
      return socket.emit('error', 'Invalid or empty slices array.');
    }
  
    try {
      // Prepare CSV data (replacing existing slices)
      let csvData = slices.map(slice => `${groupName},${slice}`).join('\n') + '\n';
  
      // Overwrite the CSV file with the new slices (replace instead of merge)
      await fs.promises.writeFile(slicesCsvFile, csvData);
      console.log('Slices replaced in CSV');
  
      // Emit updated slices to all clients in the group
      socket.emit('updateSlices', slices);
    } catch (error) {
      console.error('Error replacing slices in CSV:', error);
      socket.emit('error', 'An error occurred while saving slices.');
    }
  });
  

// Handle removing a slice
socket.on('removeSlices', ({ groupName, slice }) => {
  if (groupSlices[groupName]) {
    groupSlices[groupName] = groupSlices[groupName].filter(s => s !== slice);
    io.emit('updateSlices', groupSlices[groupName]); // Notify all clients
  } else {
    console.error(`Error: No slices found for group ${groupName}`);
    socket.emit('error', `No slices found for group ${groupName}`);
  }
});



  socket.on('deleteGroup', async (groupName) => {
    console.log(`Request received to delete group: ${groupName}`);
    
    const result = await deleteGroup(groupName);
    
    // Broadcast deletion response
    socket.emit('groupDeleteResponse', result.message);

    // Fetch updated groups after deletion
    const updatedGroups = await getAllGroups(); // This function should return the latest groups

    // Emit updated group list to all clients
    io.emit('updateGroups', updatedGroups);
});


  // Handle user login
  socket.on('login', async (username, password) => {
    try {
      const users = await readUsersFromCsv();
      console.log('Users in CSV:', users);
      console.log(`Attempting login: ${username} with password: ${password}`);

      if (users[username.toLowerCase()] && users[username.toLowerCase()] === password) {
        console.log(`${username} logged in successfully`);
        const groups = await readGroupsFromCsv();
        const userGroups = Object.entries(groups)
          .filter(([_, members]) => members.includes(username.toLowerCase()))
          .map(([groupName]) => groupName);

        socket.emit('loginSuccess', 'Login successful!', userGroups);
        socket.emit('user', `${username}`);

        // Get the groups that the user is part of
        socket.emit('userGroups', userGroups); // Emit groups to the client
        console.log(`${username}'s groups:`, userGroups);
      } else {
        console.log(`Login failed for ${username}`);
        socket.emit('loginFailure', 'Incorrect username or password');
      }
    } catch (error) {
      console.error('Error reading CSV file:', error);
      socket.emit('loginFailure', 'An error occurred. Please try again later.');
    }
  });

  // Handle creating a new user
  socket.on('create', async (username, password) => {
    try {
      const users = await readUsersFromCsv();

      // Check if user already exists
      if (users[username.toLowerCase()]) {
        socket.emit('createUserFailure', `User '${username}' already exists.`);
        console.log(`User '${username}' already exists.`);
      } else {
        // Create the new user in the CSV
        await createUserInCsv(username.toLowerCase(), password);
        
        // Notify the client that the user was created successfully
        socket.emit('createUserSuccess', `User '${username}' created successfully.`);
        console.log(`User '${username}' created.`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      socket.emit('createUserFailure', 'An error occurred while creating the user.');
    }
  });

  // Handle joining a group
  socket.on('joinGroup', async (group, user) => {
    console.log(`${user} is attempting to join group: ${group}`);
  
    try {
      let groups = await readGroupsFromCsv();
  
      if (!groups[group]) {
        socket.emit('groupJoinFailure', `The group '${group}' does not exist. Please choose a valid group.`);
        console.log(`Group '${group}' does not exist.`);
      } else {
        if (!groups[group].includes(user)) {
          console.log(`${user} is not a member of ${group}, adding...`);
          groups[group].push(user);
          
          // Save updated groups to CSV
          saveGroupsToCSV(groups);
  
          // Join the group and notify the members
          socket.join(group);
          io.to(group).emit('groupUpdate', `${user} has joined ${group}`);
          io.emit('updateGroups', groups);
          
          console.log(`${user} successfully joined group: ${group}`);
        } else {
          console.log(`${user} is already a member of ${group}`);
        }
      }
    } catch (error) {
      console.error('Error handling group join:', error);
    }
  });
  

  // Handle leaving a group
  socket.on('leaveGroup', async (group, user) => {
    console.log(`${user} left group: ${group}`);

    try {
      let groups = await readGroupsFromCsv();

      if (groups[group]) {
        groups[group] = groups[group].filter(member => member !== user);
        if (groups[group].length === 0) delete groups[group]; // Remove empty group
      }

      saveGroupsToCSV(groups);
      socket.leave(group);
      io.to(group).emit('groupUpdate', `${user} has left ${group}`);
      io.emit('updateGroups', groups);
    } catch (error) {
      console.error('Error handling group leave:', error);
    }
  });

  // Handle creating a new group
  socket.on('createGroup', async (groupName, user) => {
    console.log(`${user} is creating a new group: ${groupName}`);

    try {
      let groups = await readGroupsFromCsv();

      if (groups[groupName]) {
        // Group already exists, notify the user
        socket.emit('groupCreateFailure', `The group '${groupName}' already exists.`);
        console.log(`Group '${groupName}' already exists.`);
      } else {
        // Create the group and add the user as the first member
        groups[groupName] = [user];
        console.log(`Group '${groupName}' created by ${user}`);

        // Save the group creator to the new CSV
        saveGroupsCreatorToCSV(groupName, user);

        // Save updated groups to CSV
        saveGroupsToCSV(groups);

        // Join the group and notify the members
        socket.join(groupName);
        io.to(groupName).emit('groupUpdate', `${user} created and joined ${groupName}`);
        io.emit('updateGroups', groups); // Update all clients
      }
    } catch (error) {
      console.error('Error handling group creation:', error);
      socket.emit('groupCreateFailure', 'An error occurred while creating the group.');
    }
  });

  // Handle socket disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
