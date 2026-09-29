import api from "./api";

export const sendRequest = async (receiver_id) => {
  const res = await api.post("/partnership-requests", { receiver_id });
  return res.data;
};

export const getRequests = async () => {
  const res = await api.get("/partnership-requests");
  return res.data;
};

export const acceptRequest = async (id) => {
  const res = await api.put(`/partnership-requests/${id}/accept`);
  return res.data;
};

export const rejectRequest = async (id) => {
  const res = await api.put(`/partnership-requests/${id}/reject`);
  return res.data;
};

// Layanan Private Chat Database Real
export const getMessages = async (requestId) => {
  const res = await api.get(`/partnership-requests/${requestId}/messages`);
  return res.data;
};

export const sendMessage = async (requestId, message) => {
  const res = await api.post(`/partnership-requests/${requestId}/messages`, { message });
  return res.data;
};

// Layanan Notifikasi Lonceng
export const getNotifications = async () => {
  const res = await api.get("/partnership-requests/notifications");
  return res.data;
};

export const markAsRead = async (requestId) => {
  const res = await api.put(`/partnership-requests/${requestId}/messages/read`);
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await api.put("/partnership-requests/notifications/read-all");
  return res.data;
};