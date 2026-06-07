import React, { useEffect, useState } from "react";
import "../styles/RawMaterialStock.css";
import "../styles/ProductionPage.css";
import "../styles/PacketProduction.css";
import * as XLSX from "xlsx";

interface RawStockItem {
  id: number;
  product_id: string;
  product_code: string;
  part_code: string;
  color_code?: string;
  color_name?: string;
  color_image?: string;
  total_qty: number;
}

interface ProductionStockItem {
  id: string;
  combo_id: string;
  combo_name: string;
  total_qty: number;
  sample_image?: string;
  updated_at: string;
}

interface PacketStockItem {
  packet_code: string;
  group_name: string;
  total_qty: number;
  sample_image?: string;
  last_updated: string | null;
}

const StockOverview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"raw" | "production" | "packet">("raw");
  const [isLoading, setIsLoading] = useState(false);

  // States
  const [rawStock, setRawStock] = useState<RawStockItem[]>([]);
  const [rawSearch, setRawSearch] = useState("");

  const [productionStock, setProductionStock] = useState<ProductionStockItem[]>([]);
  const [prodSearch, setProdSearch] = useState("");

  const [packetStock, setPacketStock] = useState<PacketStockItem[]>([]);
  const [packetSearch, setPacketSearch] = useState("");
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // Helper to render image (handles both legacy base64 and ImageKit cloud URLs)
  const getImageUrl = (src?: string) => {
    if (!src) return "";
    if (src.startsWith("http")) return src;
    return `data:image/png;base64,${src}`;
  };

  // Helper to color packet stock levels
  const getStockColor = (qty: number) => {
    if (qty > 50) return "#16a34a"; // green
    if (qty > 10) return "#f59e0b"; // orange
    return "#dc2626"; // red
  };

  // 🔄 Load Raw Material Stock
  const loadRawStock = async () => {
    try {
      const entries = await (window as any).electronAPI.getRawEntries();
      const grouped = entries.reduce((acc: any[], entry: any) => {
        const key = `${entry.product_id}_${entry.part_code}_${entry.color_code || ""}_${entry.color_name || ""}`;
        const existing = acc.find((i) => i.key === key);

        if (existing) {
          existing.total_qty += entry.quantity;
        } else {
          acc.push({
            key,
            id: entry.id || entry._id,
            product_id: entry.product_id,
            product_code: "",
            part_code: entry.part_code,
            color_code: entry.color_code,
            color_name: entry.color_name,
            color_image: entry.color_image,
            total_qty: entry.quantity,
          });
        }
        return acc;
      }, []);

      const products = await (window as any).electronAPI.getProducts();
      const merged = grouped.map((item: any) => {
        const prod = products.find((p: any) => (p.id || p._id) === item.product_id);
        return {
          ...item,
          product_code: prod?.product_code || "Unknown",
        };
      });

      setRawStock(merged);
    } catch (err) {
      console.error("❌ Error loading raw stock:", err);
    }
  };

  // 🔄 Load Production Stock
  const loadProductionStock = async () => {
    try {
      const res = await (window as any).electronAPI.getProductionStock?.();
      setProductionStock(res || []);
    } catch (err) {
      console.error("❌ Error loading production stock:", err);
    }
  };

  // 🔄 Load Packet Stock
  const loadPacketStock = async () => {
    try {
      const data = await (window as any).electronAPI.getPacketStock?.();
      setPacketStock(data || []);
    } catch (err) {
      console.error("❌ Error loading packet stock:", err);
    }
  };

  // Main fetch wrapper
  const loadAllData = async () => {
    setIsLoading(true);
    if (activeTab === "raw") await loadRawStock();
    else if (activeTab === "production") await loadProductionStock();
    else if (activeTab === "packet") await loadPacketStock();
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  // Filtering
  const filteredRaw = rawStock.filter(
    (item) =>
      item.product_code.toLowerCase().includes(rawSearch.toLowerCase()) ||
      item.part_code.toLowerCase().includes(rawSearch.toLowerCase()) ||
      (item.color_code || "").toLowerCase().includes(rawSearch.toLowerCase()) ||
      (item.color_name || "").toLowerCase().includes(rawSearch.toLowerCase())
  );

  const filteredProd = productionStock.filter((item) =>
    item.combo_name.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const filteredPacket = packetStock.filter(
    (item) =>
      item.packet_code.toLowerCase().includes(packetSearch.toLowerCase()) ||
      item.group_name.toLowerCase().includes(packetSearch.toLowerCase())
  );

  // Totals
  const totalProduced = productionStock.reduce((sum, s) => sum + (s.total_qty || 0), 0);
  const totalPackets = packetStock.reduce((sum, s) => sum + (s.total_qty || 0), 0);

  // Excel Exports
  const exportRawExcel = () => {
    if (filteredRaw.length === 0) return alert("⚠️ No data available to export!");
    const data = filteredRaw.map((item) => ({
      Product: item.product_code,
      Part: item.part_code,
      "Color Code": item.color_code || "-",
      "Real Color": item.color_name || "-",
      Total_Qty: item.total_qty,
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Raw Stock");
    XLSX.writeFile(book, `RawMaterialStock_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportProdExcel = () => {
    if (filteredProd.length === 0) return alert("⚠️ No data available to export!");
    const data = filteredProd.map((item) => ({
      "Product / Combination": item.combo_name,
      "Total Quantity": item.total_qty,
      "Last Updated": new Date(item.updated_at).toLocaleString("en-IN"),
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Production Stock");
    XLSX.writeFile(book, `ProductionStock_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportPacketExcel = () => {
    if (filteredPacket.length === 0) return alert("⚠️ No data to export!");
    const data = filteredPacket.map((p) => ({
      "Packet Code": p.packet_code,
      "Group Name": p.group_name,
      "Total Quantity": p.total_qty,
      "Last Updated": p.last_updated ? new Date(p.last_updated).toLocaleString("en-IN") : "-",
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Packet Stock");
    XLSX.writeFile(book, `PacketStock_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="stock-overview-wrapper">
      {/* 🧭 Tabs Header */}
      <div className="stock-tabs-header">
        <button
          onClick={() => setActiveTab("raw")}
          className={`stock-tab-btn ${activeTab === "raw" ? "active" : ""}`}
        >
          📦 Raw Material Stock
        </button>
        <button
          onClick={() => setActiveTab("production")}
          className={`stock-tab-btn ${activeTab === "production" ? "active" : ""}`}
        >
          🏭 Production Stock
        </button>
        <button
          onClick={() => setActiveTab("packet")}
          className={`stock-tab-btn ${activeTab === "packet" ? "active" : ""}`}
        >
          📦 Packet Stock
        </button>
      </div>

      {/* 🔹 Tab Content: RAW MATERIAL */}
      {activeTab === "raw" && (
        <div className="raw-stock-container stock-tab-content">
          <h2>📦 Raw Material Stock Overview</h2>
          <div className="stock-toolbar">
            <input
              type="text"
              placeholder="🔍 Search product, part or color..."
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              className="search-input"
            />
            <div className="toolbar-buttons">
              <button onClick={loadAllData} className="btn-refresh" disabled={isLoading}>
                {isLoading ? "⏳ Loading..." : "🔄 Refresh"}
              </button>
              <button onClick={exportRawExcel} className="btn-export">
                📤 Export Excel
              </button>
            </div>
          </div>

          {filteredRaw.length === 0 ? (
            <div className="empty-state">
              <p>😕 No raw material stock data available</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Part</th>
                    <th>Color</th>
                    <th>Color Image</th>
                    <th>Total Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRaw.map((item, i) => (
                    <tr key={i}>
                      <td>{item.product_code}</td>
                      <td>{item.part_code}</td>
                      <td>
                        {item.color_code || item.color_name ? (
                          <span>
                            {item.color_code}
                            {item.color_name ? ` (${item.color_name})` : ""}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {item.color_image ? (
                          <img
                            src={getImageUrl(item.color_image)}
                            alt="Color"
                            width={50}
                            height={50}
                            className="clickable-thumbnail"
                            onClick={() => setPreviewModalImg(getImageUrl(item.color_image))}
                            style={{ borderRadius: "8px", border: "1px solid #ddd", objectFit: "cover", backgroundColor: "#fff" }}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="qty-cell">{item.total_qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 🔹 Tab Content: PRODUCTION STOCK */}
      {activeTab === "production" && (
        <div className="production-container stock-tab-content">
          <h2>🏭 Product Production Stock</h2>
          <div className="stock-toolbar">
            <input
              type="text"
              placeholder="🔍 Search product/combination..."
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
              className="search-input"
            />
            <div className="toolbar-buttons">
              <button onClick={loadAllData} className="btn-refresh" disabled={isLoading}>
                🔄 Refresh
              </button>
              <button onClick={exportProdExcel} className="btn-export btn-export-production">
                📤 Export Excel
              </button>
            </div>
          </div>

          {filteredProd.length === 0 ? (
            <div className="empty-state">
              <p>No production stock available yet.</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="stock-table production-stock-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Product / Combination</th>
                      <th style={{ textAlign: "center" }}>Total Quantity</th>
                      <th style={{ textAlign: "left" }}>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProd.map((item: any) => (
                      <tr key={item._id || item.id} className={item.total_qty > 0 ? "" : "out-of-stock"}>
                        <td style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {item.sample_image ? (
                            <img
                              src={getImageUrl(item.sample_image)}
                              alt="sample"
                              width={50}
                              height={50}
                              className="clickable-thumbnail"
                              onClick={() => setPreviewModalImg(getImageUrl(item.sample_image))}
                              style={{ borderRadius: "8px", border: "1px solid #ddd", objectFit: "cover", backgroundColor: "#fff" }}
                            />
                          ) : (
                            <div style={{ width: 50, height: 50, borderRadius: "8px", border: "1px solid #eee", background: "#f9f9f9" }} />
                          )}
                          <span style={{ fontWeight: 600 }}>{item.combo_name}</span>
                        </td>
                        <td className="qty-cell text-center">{item.total_qty}</td>
                        <td style={{ color: "#555" }}>
                          {new Date(item.updated_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="stock-summary-footer">
                Total Produced Quantity: <span className="highlight-qty">{totalProduced}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 🔹 Tab Content: PACKET STOCK */}
      {activeTab === "packet" && (
        <div className="packet-production-container stock-tab-content">
          <h2>📦 Packet Stock Overview</h2>
          <div className="stock-toolbar">
            <input
              type="text"
              placeholder="🔍 Search packet or group..."
              value={packetSearch}
              onChange={(e) => setPacketSearch(e.target.value)}
              className="search-input"
            />
            <div className="toolbar-buttons">
              <button onClick={loadAllData} className="btn-refresh" disabled={isLoading}>
                🔄 Refresh
              </button>
              <button onClick={exportPacketExcel} className="btn-export btn-export-packet">
                📤 Export Excel
              </button>
            </div>
          </div>

          {filteredPacket.length === 0 ? (
            <div className="empty-state error-state">
              ⚠️ No packet stock data found!
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="stock-table packet-stock-table">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Image</th>
                      <th>Packet Code</th>
                      <th>Group Name</th>
                      <th style={{ textAlign: "center" }}>Total Quantity</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPacket.map((p, i) => (
                      <tr key={i}>
                        <td style={{ textAlign: "center" }}>
                          {p.sample_image ? (
                            <img
                              src={getImageUrl(p.sample_image)}
                              alt={p.group_name}
                              className="clickable-thumbnail"
                              onClick={() => setPreviewModalImg(getImageUrl(p.sample_image))}
                              style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover", border: "1px solid #ddd" }}
                            />
                          ) : (
                            <div style={{ width: "50px", height: "50px", background: "#f3f4f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "12px" }}>
                              No Img
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.packet_code}</td>
                        <td>{p.group_name}</td>
                        <td className="qty-cell text-center" style={{ color: getStockColor(p.total_qty) }}>{p.total_qty}</td>
                        <td>
                          {p.last_updated
                            ? new Date(p.last_updated).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="stock-summary-footer packet-summary-footer">
                🧮 Total Packets in Stock: <span className="highlight-qty">{totalPackets}</span>
              </div>
            </>
          )}
        </div>
      )}
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

export default StockOverview;
