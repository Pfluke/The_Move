const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
const serviceAccount = require('./accountKey.json'); 

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST']
  }
});

//Users
async function getUser(username) {
  const doc = await db.collection('users').doc(username.toLowerCase()).get();
  return doc.exists ? doc.data() : null;
}

async function createUser(username, password) {
  return db.collection('users').doc(username.toLowerCase()).set({
    username: username.toLowerCase(),
    password: password
  });
}

// groups
async function getAllGroups() {
  const snapshot = await db.collection('groups').get();
  const groups = {};
  snapshot.forEach(doc => {
    groups[doc.id] = doc.data().members;
  });
  return groups;
}

async function createGroup(groupName, user) {
  const groupRef = db.collection('groups').doc(groupName);
  const doc = await groupRef.get();
  if (doc.exists) {
    throw new Error(`Group '${groupName}' already exists.`);
  }
  await groupRef.set({
    groupName: groupName,
    members: [user.toLowerCase()],
    creator: user.toLowerCase(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function joinGroup(groupName, user) {
  const groupRef = db.collection('groups').doc(groupName);
  const doc = await groupRef.get();
  if (!doc.exists) {
    throw new Error(`Group '${groupName}' does not exist.`);
  }
  await groupRef.update({
    members: admin.firestore.FieldValue.arrayUnion(user.toLowerCase())
  });
}

async function leaveGroup(groupName, user) {
  const groupRef = db.collection('groups').doc(groupName);
  const doc = await groupRef.get();
  if (!doc.exists) return;
  await groupRef.update({
    members: admin.firestore.FieldValue.arrayRemove(user.toLowerCase())
  });
  //delete the group if no members remain
  const updatedDoc = await groupRef.get();
  if (updatedDoc.data().members.length === 0) {
    await groupRef.delete();
  }
}

async function deleteGroup(groupName) {
  const groupRef = db.collection('groups').doc(groupName);
  const doc = await groupRef.get();
  if (!doc.exists) {
    throw new Error(`Group '${groupName}' does not exist.`);
  }
  await groupRef.delete();
}

async function getGroupCreator(groupName) {
  const groupRef = db.collection('groups').doc(groupName);
  const doc = await groupRef.get();
  return doc.exists ? doc.data().creator : null;
}

// slices (events placeholder I think)
async function getSlices(groupName) {
  const slicesSnapshot = await db.collection('groups').doc(groupName).collection('slices').get();
  const slices = [];
  slicesSnapshot.forEach(doc => {
    slices.push(doc.data().name);
  });
  return slices;
}

async function setSlices(groupName, slicesArray) {
  const slicesRef = db.collection('groups').doc(groupName).collection('slices');
  const snapshot = await slicesRef.get();
  const batchDelete = db.batch();
  snapshot.forEach(doc => {
    batchDelete.delete(doc.ref);
  });
  await batchDelete.commit();

  // Add new slices in a new batch
  const batchAdd = db.batch();
  slicesArray.forEach(slice => {
    const newDoc = slicesRef.doc(); // Auto-generated ID
    batchAdd.set(newDoc, { name: slice });
  });
  await batchAdd.commit();
}

// Socket.io Event Handlers
io.on('connection', async (socket) => {
  console.log('A user connected');

  // when a user connects, send them the list of groups
  try {
    const groups = await getAllGroups();
    socket.emit('updateGroups', groups);
  } catch (err) {
    console.error('Error fetching groups:', err);
  }

  // Handle login
  socket.on('login', async (username, password) => {
    try {
      const user = await getUser(username);
      if (user && user.password === password) {
        // Get groups the user is a member of
        const groupsSnapshot = await db.collection('groups')
          .where('members', 'array-contains', username.toLowerCase())
          .get();
        const userGroups = [];
        groupsSnapshot.forEach(doc => {
          userGroups.push(doc.id);
        });
        socket.emit('loginSuccess', 'Login successful!', userGroups);
        socket.emit('user', username);
        socket.emit('userGroups', userGroups);
        console.log(`${username} logged in successfully`);
      } else {
        socket.emit('loginFailure', 'Incorrect username or password');
        console.log(`Login failed for ${username}`);
      }
    } catch (error) {
      console.error(error);
      socket.emit('loginFailure', 'An error occurred. Please try again later.');
    }
  });

  // Handle account creation
  socket.on('create', async (username, password) => {
    try {
      const existingUser = await getUser(username);
      if (existingUser) {
        socket.emit('createUserFailure', `User '${username}' already exists.`);
        console.log(`User '${username}' already exists.`);
      } else {
        await createUser(username, password);
        socket.emit('createUserSuccess', `User '${username}' created successfully.`);
        console.log(`User '${username}' created.`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      socket.emit('createUserFailure', 'An error occurred while creating the user.');
    }
  });

  // Handle group join
  socket.on('joinGroup', async (group, user) => {
    try {
      await joinGroup(group, user);
      // Notify client of update
      const groupsSnapshot = await db.collection('groups')
        .where('members', 'array-contains', user.toLowerCase())
        .get();
      const userGroups = [];
      groupsSnapshot.forEach(doc => {
        userGroups.push(doc.id);
      });
      socket.emit('groupUpdate', `${user} has joined ${group}`);
      const allGroups = await getAllGroups();
      io.emit('updateGroups', allGroups);
      console.log(`${user} joined group: ${group}`);
    } catch (error) {
      console.error('Error joining group:', error);
      socket.emit('groupJoinFailure', error.message);
    }
  });

  // Handle group leave
  socket.on('leaveGroup', async (group, user) => {
    try {
      await leaveGroup(group, user);
      socket.leave(group);
      io.to(group).emit('groupUpdate', `${user} has left ${group}`);
      const allGroups = await getAllGroups();
      io.emit('updateGroups', allGroups);
      console.log(`${user} left group: ${group}`);
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  });

  // Handle group creation
  socket.on('createGroup', async (groupName, user) => {
    try {
      await createGroup(groupName, user);
      socket.join(groupName);
      io.to(groupName).emit('groupUpdate', `${user} created and joined ${groupName}`);
      const allGroups = await getAllGroups();
      io.emit('updateGroups', allGroups);
      console.log(`Group '${groupName}' created by ${user}`);
    } catch (error) {
      console.error('Error creating group:', error);
      socket.emit('groupCreateFailure', error.message);
    }
  });

  // Handle group deletion
  socket.on('deleteGroup', async (groupName) => {
    try {
      await deleteGroup(groupName);
      socket.emit('groupDeleteResponse', `Group '${groupName}' deleted successfully.`);
      const allGroups = await getAllGroups();
      io.emit('updateGroups', allGroups);
      console.log(`Group '${groupName}' deleted.`);
    } catch (error) {
      console.error('Error deleting group:', error);
      socket.emit('groupDeleteResponse', 'An error occurred while deleting the group.');
    }
  });

  // Handle fetching group creator info
  socket.on('getGroupCreatorInfo', async (groupName) => {
    try {
      const creator = await getGroupCreator(groupName);
      if (creator) {
        socket.emit('groupCreatorInfo', { groupName, creator });
      } else {
        socket.emit('groupCreatorInfo', { groupName, creator: 'No creator found' });
      }
    } catch (error) {
      console.error('Error fetching group creator:', error);
      socket.emit('groupCreatorInfo', 'An error occurred while fetching the group creator');
    }
  });

  // Handle slices (fetching)
  socket.on('requestSlices', async (groupName) => {
    try {
      const slices = await getSlices(groupName);
      socket.emit('updateSlices', slices);
    } catch (error) {
      console.error('Error fetching slices:', error);
      socket.emit('error', 'Could not fetch slices.');
    }
  });

  // Handle slices (adding/updating)
  socket.on('addSlices', async ({ groupName, slices }) => {
    try {
      if (!Array.isArray(slices) || slices.length === 0) {
        return socket.emit('error', 'Invalid or empty slices array.');
      }
      await setSlices(groupName, slices);
      socket.emit('updateSlices', slices);
      console.log(`Slices updated for group: ${groupName}`);
    } catch (error) {
      console.error('Error updating slices:', error);
      socket.emit('error', 'An error occurred while saving slices.');
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
