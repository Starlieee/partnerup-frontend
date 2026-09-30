import api from "./api";

export const getProfile = async () => {
  const res = await api.get("/profile");
  return res.data;
};

export const updateProfile = async (profileData) => {
  const res = await api.put("/profile", profileData);
  return res.data;
};