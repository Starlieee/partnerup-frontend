import api from "./api";

export const getPartners = async () => {
  const res = await api.get("/partners");
  return res.data;
};

export const searchByInterest = async (interest) => {
  const res = await api.get("/partners/search", { params: { interest } });
  return res.data;
};