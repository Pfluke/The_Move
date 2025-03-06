// firebaseConfig.js

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyA3Cr0NSHZmatNnYTWIqY3m-jdb_pm2mkM",
  authDomain: "the-move-42081.firebaseapp.com",
  projectId: "the-move-42081",
  storageBucket: "the-move-42081.firebasestorage.app",
  messagingSenderId: "1070332532928",
  appId: "1:1070332532928:web:538178558d8d425d5ff525",
  measurementId: "G-8K8WFBMX4D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app, firebaseConfig };
