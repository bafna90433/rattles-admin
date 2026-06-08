import React, { useEffect, useMemo, useState } from "react";
import "../styles/RawMaterialStock.css";
import "../styles/ProductionPage.css";
import "../styles/PacketProduction.css";
import * as XLSX from "xlsx";
import {
  MdFileDownload,
  MdInventory2,
  MdOutlineFactory,
  MdOutlineInventory,
  MdRefresh,
  MdSearch,
} from "react-icons/md";

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
  const [rawStock, setRawStock] = useState<RawStockItem[]>([]);
  const [rawSearch, setRawSearch] = useState("");
  const [productionStock, setProductionStock] = useState<ProductionStockItem[]>([]);
  const [prodSearch, setProdSearch] = useState("");
  const [packetStock, setPacketStock] = useState<PacketStockItem[]>([]);
  const [packetSearch, setPacketSearch] = useState("");
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const getImageUrl = (src?: string) => {
    if (!src) return "";
    if (src.startsWith("http")) return src;
    return `data:image/png;base64,${src}`;
  };

  const getStockColor = (qty: number) => {
    if (qty > 50) return "#15803d";
    if (qty > 10) return "#b45309";
    return "#b91c1c";
  };

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
      console.error("Error loading raw stock:", err);
    }
  };

  const loadProductionStock = async () => {
    try {
      const res = await (window as any).electronAPI.getProductionStock?.();
      setProductionStock(res || []);
    } catch (err) {
      console.error("Error loading production stock:", err);
    }
  };

  const loadPacketStock = async () => {
    try {
      const data = await (window as any).electronAPI.getPacketStock?.();
      setPacketStock(data || []);
    } catch (err) {
      console.error("Error loading packet stock:", err);
    }
  };

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

  const totalProduced = productionStock.reduce((sum, s) => sum + (s.total_qty || 0), 0);
  const totalPackets = packetStock.reduce((sum, s) => sum + (s.total_qty || 0), 0);

  const pageMeta = useMemo(() => {
    if (activeTab === "production") {
      return {
        title: "Production Stock",
        subtitle: "Finished combination stock with latest production updates.",
        countLabel: "Combinations",
        count: filteredProd.length,
        totalLabel: "Total Produced",
        total: totalProduced,
      };
    }

    if (activeTab === "packet") {
      return {
        title: "Packet Stock",
        subtitle: "Available packet stock grouped by packet code and group.",
        countLabel: "Packets",
        count: filteredPacket.length,
        totalLabel: "Total Packets",
        total: totalPackets,
      };
    }

    return {
      title: "Raw Material Stock",
      subtitle: "Live raw material quantity by product, part and color.",
      countLabel: "Materials",
      count: filteredRaw.length,
      totalLabel: "Total Quantity",
      total: filteredRaw.reduce((sum, item) => sum + (item.total_qty || 0), 0),
    };
  }, [activeTab, filteredRaw, filteredProd, filteredPacket, totalProduced, totalPackets]);

  const tabs = [
    { key: "raw" as const, label: "Raw Material", icon: <MdInventory2 size={18} /> },
    { key: "production" as const, label: "Production", icon: <MdOutlineFactory size={18} /> },
    { key: "packet" as const, label: "Packet Stock", icon: <MdOutlineInventory size={18} /> },
  ];

  const exportRawExcel = () => {
    if (filteredRaw.length === 0) return alert("No data available to export!");
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
    if (filteredProd.length === 0) return alert("No data available to export!");
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
    if (filteredPacket.length === 0) return alert("No data to export!");
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
      <div className="stock-page-header">
        <div>
          <p className="stock-kicker">Inventory Overview</p>
          <h1>{pageMeta.title}</h1>
          <span>{pageMeta.subtitle}</span>
        </div>
        <div className="stock-header-metrics">
          <div className="stock-metric">
            <small>{pageMeta.countLabel}</small>
            <strong>{pageMeta.count.toLocaleString("en-IN")}</strong>
          </div>
          <div className="stock-metric accent">
            <small>{pageMeta.totalLabel}</small>
            <strong>{pageMeta.total.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      <div className="stock-tabs-header" role="tablist" aria-label="Stock type">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`stock-tab-btn ${activeTab === tab.key ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "raw" && (
        <div className="raw-stock-container stock-tab-content">
          <div className="stock-panel-heading">
            <h2>Raw Material Stock Overview</h2>
            <span>{filteredRaw.length.toLocaleString("en-IN")} rows</span>
          </div>
          <div className="stock-toolbar">
            <label className="stock-search-field">
              <MdSearch size={18} />
              <input
                type="text"
                placeholder="Search product, part or color..."
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                className="search-input"
              />
            </label>
            <div className="toolbar-buttons">
              <button onClick={loadAllData} className="btn-refresh" disabled={isLoading}>
                <MdRefresh size={18} />
                {isLoading ? "Loading..." : "Refresh"}
              </button>
              <button onClick={exportRawExcel} className="btn-export">
                <MdFileDownload size={18} />
                Export Excel
              </button>
            </div>
          </div>

          {filteredRaw.length === 0 ? (
            <div className="empty-state">
              <p>No raw material stock data available</p>
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
                          <span className="color-code-chip">
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
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="qty-cell"><span>{item.total_qty.toLocaleString("en-IN")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "production" && (
        <div className="production-container stock-tab-content">
          <div className="stock-panel-heading">
            <h2>Product Production Stock</h2>
            <span>{filteredProd.length.toLocaleString("en-IN")} rows</span>
          </div>
          <div className="stock-toolbar">
            <label className="stock-search-field">
              <MdSearch size={18} />
              <input
                type="text"
                placeholder="Search product/combination..."
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                className="search-input"
              />
            </label>
            <div className="toolbar-buttons">
              <button onClick={loadAllData} className="btn-refresh" disabled={isLoading}>
                <MdRefresh size={18} />
                Refresh
              </button>
              <button onClick={exportProdExcel} className="btn-export btn-export-production">
                <MdFileDownload size={18} />
                Export Excel
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
                            />
                          ) : (
                            <div className="stock-image-placeholder" />
                          )}
                          <span style={{ fontWeight: 600 }}>{item.combo_name}</span>
                        </td>
                        <td className="qty-cell text-center"><span>{item.total_qty.toLocaleString("en-IN")}</span></td>
                        <td style={{ color: "#475467" }}>
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
                Total Produced Quantity: <span className="highlight-qty">{totalProduced.toLocaleString("en-IN")}</span>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "packet" && (
        <div className="packet-production-container stock-tab-content">
          <div className="stock-panel-heading">
            <h2>Packet Stock Overview</h2>
            <span>{filteredPacket.length.toLocaleString("en-IN")} rows</span>
          </div>
          <div className="stock-toolbar">
            <label className="stock-search-field">
              <MdSearch size={18} />
              <input
                type="text"
                placeholder="Search packet or group..."
                value={packetSearch}
                onChange={(e) => setPacketSearch(e.target.value)}
                className="search-input"
              />
            </label>
            <div className="toolbar-buttons">
              <button onClick={loadAllData} className="btn-refresh" disabled={isLoading}>
                <MdRefresh size={18} />
                Refresh
              </button>
              <button onClick={exportPacketExcel} className="btn-export btn-export-packet">
                <MdFileDownload size={18} />
                Export Excel
              </button>
            </div>
          </div>

          {filteredPacket.length === 0 ? (
            <div className="empty-state error-state">
              No packet stock data found.
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
                            />
                          ) : (
                            <div className="stock-image-placeholder">No Img</div>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.packet_code}</td>
                        <td>{p.group_name}</td>
                        <td className="qty-cell text-center" style={{ color: getStockColor(p.total_qty) }}>
                          <span>{p.total_qty.toLocaleString("en-IN")}</span>
                        </td>
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
                Total Packets in Stock: <span className="highlight-qty">{totalPackets.toLocaleString("en-IN")}</span>
              </div>
            </>
          )}
        </div>
      )}

      {previewModalImg && (
        <div className="image-preview-modal-overlay" onClick={() => setPreviewModalImg(null)}>
          <div className="image-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview-modal" onClick={() => setPreviewModalImg(null)}>x</button>
            <img src={previewModalImg} alt="Large Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default StockOverview;
