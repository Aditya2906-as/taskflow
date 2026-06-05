import api from './axios';

export const getWikiPages   = (boardId)        => api.get(`/wiki/${boardId}/pages`);
export const createWikiPage = (boardId, data)  => api.post(`/wiki/${boardId}/pages`, data);
export const updateWikiPage = (id, data)       => api.put(`/wiki/pages/${id}`, data);
export const deleteWikiPage = (id)             => api.delete(`/wiki/pages/${id}`);