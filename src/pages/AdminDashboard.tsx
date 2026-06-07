import React, { useEffect, useState, useCallback } from "react";
import "../styles/AdminDashboard.css";
import { getImageUrl } from "../utils/image";
import {
  BsBoxSeam,
  BsPuzzle,
  BsArchive,
  BsBoxArrowRight,
  BsCheckCircle,
  BsBox2Fill,
} from "react-icons/bs";
import { FiRefreshCw } from "react-icons/fi";

// ===============================
// Interfaces for Type Safety
// ===============================
interface ProductionEntry {
  id: string | number;
  combo_name: string;
  sample_image: string | null;
  qty: number;
  entry_by: string;
  date: string | number;
}

interface PacketProduction {
  id: string | number;
  packet_code: string;
  group_name: string;
  qty: number;
  entry_by: string;
  date: string | number;
  sample_image?: string | null;
}

interface RawEntry {
  id: string | number;
  part_code: string;
  color_image: string | null;
  color_code: string | null;
  color_name?: string | null;
  quantity: number;
  entry_by: string;
  entry_date: string | number;
}

// ===============================
// Main Component
// ===============================
const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    products: 0,
    combinations: 0,
    rawEntries: 0,
    minusEntries: 0,
    productProductions: 0,
    packetProductions: 0,
  });

  const [recentProductProductions, setRecentProductProductions] =
    useState<ProductionEntry[]>([]);
  const [recentPacketProductions, setRecentPacketProductions] =
    useState<PacketProduction[]>([]);
  const [recentEntries, setRecentEntries] = useState<RawEntry[]>([]);
  const [packetCombinations, setPacketCombinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // ====================================================
  // 🔄 Load Dashboard Data
  // ====================================================
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        products,
        combos,
        rawEntries,
        productProductions,
        packetProductions,
        packetCombos,
      ] = await Promise.all([
        (window as any).electronAPI.getProducts?.(),
        (window as any).electronAPI.getCombinations?.(),
        (window as any).electronAPI.getRawEntries?.(),
        (window as any).electronAPI.getProductionEntries?.(),
        (window as any).electronAPI.getPacketProductions?.(),
        (window as any).electronAPI.getPacketCombinations?.(),
      ]);

      setPacketCombinations(packetCombos || []);

      const minusEntries = rawEntries?.filter((e: any) => e.quantity < 0) || [];

      setStats({
        products: products?.length || 0,
        combinations: combos?.length || 0,
        rawEntries: rawEntries?.length || 0,
        minusEntries: minusEntries?.length || 0,
        productProductions: productProductions?.length || 0,
        packetProductions: packetProductions?.length || 0,
      });

      // --- Product Productions
      const sortedProductProductions =
        productProductions?.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ) || [];

      // --- Packet Productions
      const enrichedPackets =
        packetProductions?.map((p: any) => {
          const combo = packetCombos?.find(
            (c: any) => c.group_name === p.group_name
          );
          return {
            ...p,
            sample_image: combo?.sample_image || null,
          };
        }) || [];

      const sortedPacketProductions =
        enrichedPackets.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ) || [];

      const sortedRawEntries =
        rawEntries?.sort(
          (a: any, b: any) =>
            new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
        ) || [];

      setRecentProductProductions(sortedProductProductions.slice(0, 5));
      setRecentPacketProductions(sortedPacketProductions.slice(0, 5));
      setRecentEntries(sortedRawEntries.slice(0, 5));
    } catch (error) {
      console.error("❌ Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ====================================================
  // ⏳ Loading State
  // ====================================================
  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <FiRefreshCw className="spinner" size={40} />
        <p>Loading data...</p>
      </div>
    );
  }

  // ====================================================
  // 🧱 Main Dashboard UI
  // ====================================================
  return (
    <div className="admin-dashboard">
      {/* --- HEADER --- */}
      <div className="dashboard-header">
        <div>
          <h2>🧱 Admin Dashboard</h2>
          <p className="subtitle">
            Full overview of your production, packets & materials
          </p>
        </div>
        <button
          className="refresh-button"
          onClick={loadDashboardData}
          disabled={loading}
        >
          <FiRefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="dashboard-cards">
        <div className="card card-products">
          <div className="card-icon">
            <BsBoxSeam size={24} />
          </div>
          <div className="card-info">
            <h3>{stats.products}</h3>
            <p>Products</p>
          </div>
        </div>

        <div className="card card-combinations">
          <div className="card-icon">
            <BsPuzzle size={24} />
          </div>
          <div className="card-info">
            <h3>{stats.combinations}</h3>
            <p>Combinations</p>
          </div>
        </div>

        <div className="card card-entries">
          <div className="card-icon">
            <BsArchive size={24} />
          </div>
          <div className="card-info">
            <h3>{stats.rawEntries}</h3>
            <p>Raw Material Entries</p>
          </div>
        </div>

        <div className="card card-warning">
          <div className="card-icon">
            <BsBoxArrowRight size={24} />
          </div>
          <div className="card-info">
            <h3>{stats.minusEntries}</h3>
            <p>Entries (Used)</p>
          </div>
        </div>

        <div className="card card-success">
          <div className="card-icon">
            <BsCheckCircle size={24} />
          </div>
          <div className="card-info">
            <h3>{stats.productProductions}</h3>
            <p>Product Productions</p>
          </div>
        </div>

        <div className="card card-packet">
          <div className="card-icon">
            <BsBox2Fill size={24} />
          </div>
          <div className="card-info">
            <h3>{stats.packetProductions}</h3>
            <p>Packet Productions</p>
          </div>
        </div>
      </div>

      {/* --- PRODUCTION TABLES --- */}
      <div className="dashboard-tables">
        {/* 🏭 Product Productions */}
        <div className="table-section">
          <h4>🏭 Product Productions</h4>
          <table>
            <thead>
              <tr>
                <th>Sample</th>
                <th>Group</th>
                <th>Qty</th>
                <th>By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentProductProductions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No product productions yet
                  </td>
                </tr>
              ) : (
                recentProductProductions.map((p, i) => (
                  <tr key={p.id || i}>
                    <td className="text-center">
                      {p.sample_image ? (
                        <img
                          className="table-image clickable-thumbnail"
                          src={getImageUrl(p.sample_image)}
                          alt="Sample"
                          onClick={() => setPreviewModalImg(getImageUrl(p.sample_image))}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{p.combo_name}</td>
                    <td className="text-center qty-plus">{p.qty}</td>
                    <td>{p.entry_by}</td>
                    <td>{new Date(p.date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 📦 Packet Productions */}
        <div className="table-section">
          <h4>📦 Packet Productions</h4>
          <table>
            <thead>
              <tr>
                <th>Sample</th>
                <th>Packet</th>
                <th>Group</th>
                <th>Qty</th>
                <th>By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPacketProductions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No packet productions yet
                  </td>
                </tr>
              ) : (
                recentPacketProductions.map((p, i) => (
                  <tr key={p.id || i}>
                    <td className="text-center">
                      {p.sample_image ? (
                        <img
                          className="table-image clickable-thumbnail"
                          src={getImageUrl(p.sample_image)}
                          alt="Sample"
                          onClick={() => setPreviewModalImg(getImageUrl(p.sample_image))}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{p.packet_code}</td>
                    <td>{p.group_name}</td>
                    <td className="text-center qty-plus">{p.qty}</td>
                    <td>{p.entry_by}</td>
                    <td>{new Date(p.date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- RAW MATERIAL TABLE --- */}
      <div className="dashboard-tables" style={{ marginTop: "24px" }}>
        <div className="table-section" style={{ gridColumn: "1 / -1" }}>
          <h4>📋 Recent Raw Material Entries</h4>
          <table>
            <thead>
              <tr>
                <th>Part Image</th>
                <th>Part</th>
                <th>Color</th>
                <th>Qty</th>
                <th>By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No entries yet
                  </td>
                </tr>
              ) : (
                recentEntries.map((e, i) => (
                  <tr key={e.id || i}>
                    <td className="text-center">
                      {e.color_image ? (
                        <img
                          className="table-image clickable-thumbnail"
                          src={getImageUrl(e.color_image)}
                          alt="Part"
                          onClick={() => setPreviewModalImg(getImageUrl(e.color_image))}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{e.part_code}</td>
                    <td>
                      {e.color_code || "-"}
                      {e.color_name ? ` (${e.color_name})` : ""}
                    </td>
                    <td
                      className={`text-center ${
                        e.quantity < 0 ? "qty-minus" : "qty-plus"
                      }`}
                    >
                      {e.quantity}
                    </td>
                    <td>{e.entry_by}</td>
                    <td>{new Date(e.entry_date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🖼️ Global Zoom Preview Modal */}
      {previewModalImg && (
        <div className="image-preview-modal-overlay" onClick={() => setPreviewModalImg(null)}>
          <div className="image-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview-modal" onClick={() => setPreviewModalImg(null)}>✕</button>
            <img src={previewModalImg} alt="Large Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
