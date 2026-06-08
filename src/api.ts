import axios from "axios";

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:5000/api";

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically inject JWT token from localStorage into headers
apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const api = {
  // ==========================================================
  // 🔐 AUTH HANDLER
  // ==========================================================
  loginUser: async (data: any) => {
    try {
      const res = await apiInstance.post("/auth/login", data);
      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.user.role);
        localStorage.setItem("username", res.data.user.username);
        return { success: true, role: res.data.user.role };
      }
      return { success: false, message: "Invalid credentials" };
    } catch (err: any) {
      console.error("❌ Login error:", err.response?.data?.error || err.message);
      return { success: false, message: err.response?.data?.error || "Login failed" };
    }
  },

  // ==========================================================
  // 🧩 COMBINATION HANDLERS
  // ==========================================================
  saveCombination: async (data: any) => {
    const res = await apiInstance.post("/combinations", data);
    return res.data;
  },
  getCombinations: async () => {
    const res = await apiInstance.get("/combinations");
    return res.data;
  },
  deleteCombination: async (id: any) => {
    const res = await apiInstance.delete(`/combinations/${id}`);
    return res.data;
  },
  updateCombination: async (id: any, data: any) => {
    const res = await apiInstance.put(`/combinations/${id}`, data);
    return res.data;
  },

  // ==========================================================
  // 🧱 PRODUCT HANDLERS
  // ==========================================================
  saveProduct: async (product: any) => {
    const res = await apiInstance.post("/products", product);
    return "✅ Product saved successfully!";
  },
  getProducts: async () => {
    const res = await apiInstance.get("/products");
    return res.data;
  },
  updateProduct: async (product: any) => {
    const res = await apiInstance.put(`/products/${product.id || product._id}`, product);
    return "✅ Product updated successfully!";
  },
  deleteProduct: async (id: any) => {
    const res = await apiInstance.delete(`/products/${id}`);
    return "🗑️ Product deleted successfully!";
  },

  // ==========================================================
  // ⚙️ RAW MATERIAL HANDLERS
  // ==========================================================
  saveRawEntry: async (entry: any) => {
    const res = await apiInstance.post("/raw-entries", entry);
    return { success: true, message: "Raw material entry saved successfully!" };
  },
  getRawEntries: async () => {
    const res = await apiInstance.get("/raw-entries");
    return res.data;
  },
  updateRawEntry: async (entry: any) => {
    const res = await apiInstance.put(`/raw-entries/${entry.id || entry._id}`, entry);
    return { success: true, message: "Entry updated successfully!" };
  },
  deleteRawEntry: async (id: any) => {
    const res = await apiInstance.delete(`/raw-entries/${id}`);
    return { success: true, message: "Entry deleted successfully!" };
  },
  getRawStock: async () => {
    const res = await apiInstance.get("/raw-stock");
    return res.data;
  },

  // ==========================================================
  // 🏭 PRODUCTION HANDLERS
  // ==========================================================
  saveProductionEntry: async (entry: any) => {
    const res = await apiInstance.post("/production-entries", entry);
    return { success: true, message: "Production saved and stock updated!" };
  },
  getProductionEntries: async () => {
    const res = await apiInstance.get("/production-entries");
    return res.data;
  },
  deleteProductionEntry: async (id: any) => {
    const res = await apiInstance.delete(`/production-entries/${id}`);
    return { success: true };
  },
  getProductionStock: async () => {
    const res = await apiInstance.get("/production-stock");
    return res.data;
  },

  // ==========================================================
  // 📦 PACKET SYSTEM HANDLERS
  // ==========================================================
  savePacket: async (data: any) => {
    const res = await apiInstance.post("/packets", data);
    return "✅ Packet saved successfully!";
  },
  getPackets: async () => {
    const res = await apiInstance.get("/packets");
    return res.data;
  },

  savePacketCombination: async (data: any) => {
    const res = await apiInstance.post("/packet-combinations", data);
    return "✅ Packet combination saved successfully!";
  },
  getPacketCombinations: async () => {
    const res = await apiInstance.get("/packet-combinations");
    return res.data;
  },

  savePacketProduction: async (data: any) => {
    const res = await apiInstance.post("/packet-productions", data);
    return "✅ Packet production entry saved!";
  },
  getPacketProductions: async () => {
    const res = await apiInstance.get("/packet-productions");
    return res.data;
  },

  updateProductStockByPacket: async (data: any) => {
    const res = await apiInstance.post("/update-product-stock-by-packet", data);
    return "✅ Product stock updated successfully!";
  },

  getPacketStock: async () => {
    const res = await apiInstance.get("/packet-stock");
    return res.data;
  },
  getProducedProducts: async () => {
    const res = await apiInstance.get("/produced-products");
    return res.data;
  },

  // 💰 NEW: PACKET SALES HANDLERS
  savePacketSale: async (data: any) => {
    const res = await apiInstance.post("/packet-sales", data);
    return res.data.message;
  },
  getPacketSales: async () => {
    const res = await apiInstance.get("/packet-sales");
    return res.data;
  },

  getDashboardSettings: async () => {
    const res = await apiInstance.get("/dashboard-settings");
    return res.data;
  },
  updateWorkflowImage: async (key: string, data: { title?: string; image?: string }) => {
    const res = await apiInstance.put(`/dashboard-settings/workflow-image/${key}`, data);
    return res.data;
  },
};
