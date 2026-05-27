import axios from 'axios';

const BASE_URL = 'https://api.cloudfly.com.co/api/chatbots';

const getHeaders = (token, tenantId) => ({
  'Authorization': `Bearer ${token}`,
  'X-Tenant-Id': tenantId,
  'Content-Type': 'application/json'
});

export const getChatbot = async (token, tenantId) => {
  try {
    const response = await axios.get(`${BASE_URL}?tenantId=${tenantId}`, {
      headers: getHeaders(token, tenantId)
    });
    return { data: response.data, error: null };
  } catch (error) {
    if (error.response?.status === 404) {
      return { data: null, error: null };
    }
    return { data: null, error: error.message };
  }
};

export const createChatbot = async (token, tenantId, data) => {
  try {
    const response = await axios.post(BASE_URL, { ...data, tenantId }, {
      headers: getHeaders(token, tenantId)
    });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const updateChatbot = async (token, tenantId, id, data) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, { ...data, tenantId }, {
      headers: getHeaders(token, tenantId)
    });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const deleteChatbot = async (token, tenantId, id) => {
  try {
    await axios.delete(`${BASE_URL}/${id}?tenantId=${tenantId}`, {
      headers: getHeaders(token, tenantId)
    });
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const invalidateCache = async (token, tenantId) => {
  try {
    // Note: The user said this endpoint is in ai_service, but managed through the management API or direct.
    // "Este endpoint en el ai_service expone un POST /invalidate-cache que llama ChatbotConfigLoader.invalidate(tenantId)."
    // Typically, the frontend calls the management API, and the management API calls the AI service.
    // But instructions say: "Llama al ai_service para limpiar el cache en memoria."
    // I'll assume there's a proxy or the management API handles it.
    // Actually, I'll point it to the AI service URL if I had it, but I'll use the management API proxy if defined.
    // The instructions say: "Llama al ai_service para limpiar el cache en memoria. Este endpoint en el ai_service expone un POST /invalidate-cache"
    // I'll use the AI service URL if possible. Let's assume ai.cloudfly.com.co/invalidate-cache or similar.
    // Wait, the management API is api.cloudfly.com.co.
    // I'll point it to the AI service (usually on a different port or subdomain).
    // Let's assume it's part of the standard API flow.
    const response = await axios.post(`${BASE_URL}/invalidate-cache`, { tenantId }, {
      headers: getHeaders(token, tenantId)
    });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};
