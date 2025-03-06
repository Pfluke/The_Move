const express = require('express');
const http = require('http');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); 

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();


const app = express();
const server = http.createServer(app);


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

// Start the server
server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
