let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket Connected]: ${socket.id}`);

    // Join room for a specific service
    socket.on('join_service', (serviceId) => {
      if (serviceId) {
        socket.join(`service:${serviceId}`);
        console.log(`Socket ${socket.id} joined room: service:${serviceId}`);
      }
    });

    // Leave service room
    socket.on('leave_service', (serviceId) => {
      if (serviceId) {
        socket.leave(`service:${serviceId}`);
        console.log(`Socket ${socket.id} left room: service:${serviceId}`);
      }
    });

    // Join room for a specific organisation
    socket.on('join_org', (orgId) => {
      if (orgId) {
        socket.join(`org:${orgId}`);
        console.log(`Socket ${socket.id} joined room: org:${orgId}`);
      }
    });

    // Join room for a specific ticket (for private turn alerts)
    socket.on('join_ticket', (ticketId) => {
      if (ticketId) {
        socket.join(`ticket:${ticketId}`);
        console.log(`Socket ${socket.id} joined room: ticket:${ticketId}`);
      }
    });

    // Join room for logged-in user
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined room: user:${userId}`);
      }
    });

    // Join admin room for campus-wide overview alerts
    socket.on('join_admin', () => {
      socket.join('admin');
      console.log(`Socket ${socket.id} joined admin room`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected]: ${socket.id}`);
    });
  });
};

const getIO = () => {
  return ioInstance;
};

// Real-time broadcast helpers
const emitToService = (serviceId, event, data) => {
  if (ioInstance && serviceId) {
    const sId = serviceId.toString ? serviceId.toString() : String(serviceId);
    ioInstance.to(`service:${sId}`).emit(event, data);
    // Also mirror to admin room for centralized monitoring
    ioInstance.to('admin').emit(event, { ...data, serviceId: sId });
  }
};

const emitToTicket = (ticketId, event, data) => {
  if (ioInstance && ticketId) {
    ioInstance.to(`ticket:${ticketId}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (ioInstance && userId) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
};

const emitToAdmin = (event, data) => {
  if (ioInstance) {
    ioInstance.to('admin').emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToService,
  emitToTicket,
  emitToUser,
  emitToAdmin,
};
