import { io } from "socket.io-client";

// Replace with your local machine's IP
const SOCKET_URL = "http://10.141.98.232:3000"; 

const socket = io(SOCKET_URL, {
  transports: ["websocket"], // Ensures WebSocket is used for connection
  forceNew: true,
  reconnectionAttempts: 10,
  timeout: 10000,
});

export default socket;
