// PeerJS video conferencing: relay peer IDs to all users in the meeting
// This must be inside the io.on("connection") handler, after meetingId is available

// module.exports = (io) => {
//   // Middleware to authenticate socket connections
//   io.use(async (socket, next) => {
//     try {
//       const { token } = socket.handshake.query;
//       if (!token) throw new Error("Authentication error");

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       socket.user = decoded;
//       next();
//     } catch (err) {
//       next(new Error("Authentication failed"));
//     }
//   });

 
const Meeting = require("../models/Meeting-service");
const jwt = require("jsonwebtoken");

module.exports = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.query;
      if (!token) throw new Error("Authentication error");

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });


   // Handle attendee joining waiting room
  io.on("connection", async (socket) => {
    const { meetingId } = socket.handshake.query;

  // PeerJS video conferencing: relay peer IDs to all users in the meeting
  socket.on("peerId", (peerId) => {
    // Broadcast this peerId to all other sockets in the same meeting
    socket.to(meetingId).emit("userPeerId", peerId);
  });

  socket.on("joinWaitingRoom", async ({ name, email }, callback) => {
    try {
      const meeting = await Meeting.findOne({ meetingId });
      if (!meeting) throw new Error("Meeting not found");

      const attendee = { name, email, socketId: socket.id };
      meeting.waitingRoom.push(attendee);
      await meeting.save();

      // Notify host about new attendee
      io.to(meetingId).emit("attendeeJoined", {
        attendee,
        requiresApproval: meeting.requiresApproval
      });

      callback({ status: "waiting" });
    } catch (err) {
      callback({ error: err.message });
    }
  });

    // Handle host admitting an attendee
    socket.on("admitAttendee", async ({ attendeeId }, callback) => {
      try {
        if (!socket.user.isHost) throw new Error("Unauthorized");

        const meeting = await Meeting.findOne({ meetingId });
        if (!meeting) throw new Error("Meeting not found");

        const attendeeIndex = meeting.waitingRoom.findIndex(
          a => a._id.toString() === attendeeId
        );
        if (attendeeIndex === -1) throw new Error("Attendee not found");

        const [attendee] = meeting.waitingRoom.splice(attendeeIndex, 1);
        meeting.attendees.push(attendee);
        await meeting.save();

        // Notify the admitted attendee
        io.to(attendee.socketId).emit("admissionApproved");

        // Notify all clients about the update
        io.to(meetingId).emit("attendeeAdmitted", {
          attendee,
          attendees: meeting.attendees,
          waitingRoom: meeting.waitingRoom
        });

        callback({ status: "success" });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    // Handle host rejecting an attendee
    socket.on("rejectAttendee", async ({ attendeeId }, callback) => {
      try {
        if (!socket.user.isHost) throw new Error("Unauthorized");

        const meeting = await Meeting.findOne({ meetingId });
        if (!meeting) throw new Error("Meeting not found");

        const attendeeIndex = meeting.waitingRoom.findIndex(
          a => a._id.toString() === attendeeId
        );
        if (attendeeIndex === -1) throw new Error("Attendee not found");

        const [attendee] = meeting.waitingRoom.splice(attendeeIndex, 1);
        await meeting.save();

        // Notify the rejected attendee
        io.to(attendee.socketId).emit("admissionRejected");

        // Notify all clients about the update
        io.to(meetingId).emit("attendeeRejected", {
          attendeeId,
          waitingRoom: meeting.waitingRoom
        });

        callback({ status: "success" });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    // Handle attendee leaving
    socket.on("leaveMeeting", async () => {
      try {
        const meeting = await Meeting.findOne({ meetingId });
        if (!meeting) throw new Error("Meeting not found");

        // Remove attendee from attendees and waitingRoom
        meeting.attendees = meeting.attendees.filter(a => a.socketId !== socket.id);
        meeting.waitingRoom = meeting.waitingRoom.filter(a => a.socketId !== socket.id);
        await meeting.save();

        // Notify all clients about the update
        io.to(meetingId).emit("attendeeLeft", {
          socketId: socket.id,
          attendees: meeting.attendees,
          waitingRoom: meeting.waitingRoom
        });
      } catch (err) {
        // Optionally handle error
      }
    });

    // Handle attendee requesting to start the meeting
    socket.on("requestStartMeeting", async (data, callback) => {
      try {
        // Only non-hosts can request
        if (socket.user.isHost) throw new Error("Host cannot request to start meeting");
        const meeting = await Meeting.findOne({ meetingId });
        if (!meeting) throw new Error("Meeting not found");
        // Find the host's socketId (must be in attendees with isHost true)
        const host = meeting.attendees.find(a => a.isHost);
        if (!host || !host.socketId) throw new Error("Host not connected");
        // Notify the host
        io.to(host.socketId).emit("startMeetingRequested", {
          requester: {
            name: socket.user.name,
            email: socket.user.email,
            socketId: socket.id
          }
        });
        // Notify the attendee (self) that the request is waiting
        socket.emit("startMeetingWaiting");
        callback && callback({ status: "requested" });
      } catch (err) {
        callback && callback({ error: err.message });
      }
    });

    // Host accepts the start meeting request
    socket.on("acceptStartMeeting", async ({ requesterSocketId }, callback) => {
      try {
        if (!socket.user.isHost) throw new Error("Only host can accept start meeting");
        // Notify all attendees that meeting has started
        io.to(meetingId).emit("meetingStarted", { startedBy: socket.user.name });
        // Optionally, notify the requester directly
        if (requesterSocketId) io.to(requesterSocketId).emit("startMeetingAccepted");
        callback && callback({ status: "accepted" });
      } catch (err) {
        callback && callback({ error: err.message });
      }
    });

    // Host rejects the start meeting request
    socket.on("rejectStartMeeting", async ({ requesterSocketId }, callback) => {
      try {
        if (!socket.user.isHost) throw new Error("Only host can reject start meeting");
        if (requesterSocketId) io.to(requesterSocketId).emit("startMeetingRejected");
        callback && callback({ status: "rejected" });
      } catch (err) {
        callback && callback({ error: err.message });
      }
    });
    // ...existing code for leaveMeeting and other handlers...
  });
};