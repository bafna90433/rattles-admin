import React, { useState, useEffect } from "react";
import {
  MdCloudUpload,
  MdSave,
  MdClose,
  MdAdd,
  MdList
} from "react-icons/md";
import "../styles/PacketReference.css";
import { convertToWebP } from "../utils/webp";

interface Packet {
  id?: string;
  _id?: string;
  packet_code: string;
  packet_image: string;
}

const PacketReference: React.FC = () => {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [packetCode, setPacketCode] = useState("");
  const [packetImage, setPacketImage] = useState<string>("");
  const [previewPacket, setPreviewPacket] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");
  const [isSaving, setIsSaving] = useState(false);

  // Helper to render image (handles both legacy base64 and ImageKit cloud URLs)
  const getImageUrl = (src?: string) => {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:image")) return src;
    return `data:image/png;base64,${src}`;
  };

  // 🔄 Load Packets from DB
  const loadPackets = async () => {
    const res = await (window as any).electronAPI.getPackets?.();
    setPackets(res || []);
  };

  useEffect(() => {
    loadPackets();
  }, []);

  // 🖼️ Upload Image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { base64, dataUrl } = await convertToWebP(file);
      setPacketImage(base64);
      setPreviewPacket(dataUrl);
    }
  };

  // 💾 Save Packet
  const handleSave = async () => {
    if (!packetCode.trim() || !packetImage) {
      alert("⚠️ Please enter packet code and select an image!");
      return;
    }

    setIsSaving(true);
    try {
      const res = await (window as any).electronAPI.savePacket?.({
        packet_code: packetCode.trim(),
        packet_image: packetImage,
      });
      alert(res || "✅ Packet saved!");
      setPacketCode("");
      setPacketImage("");
      setPreviewPacket("");
      await loadPackets();
      setActiveTab("list");
    } catch (err: any) {
      alert("❌ Save error: " + (err.message || "Failed to save packet"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPacketCode("");
    setPacketImage("");
    setPreviewPacket("");
  };

  return (
    <div className="packet-reference-container">
      {/* 🧭 Page Header */}
      <div className="product-ref-header">
        <div className="header-info">
          <h2>Packet Reference Manager</h2>
          <p>Define standard packet codes and upload reference package designs for packaging catalog.</p>
        </div>
      </div>

      {/* 🔀 Segmented Control Tab Switcher */}
      <div className="segmented-control-container">
        <div className="segmented-control">
          <button
            className={`segmented-btn ${activeTab === "entry" ? "active" : ""}`}
            onClick={() => setActiveTab("entry")}
          >
            <MdAdd size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} /> Add New Packet
          </button>
          <button
            className={`segmented-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <MdList size={16} style={{ marginRight: "4px", verticalAlign: "middle" }} /> Packet Reference List
          </button>
        </div>
      </div>

      {/* ➕ Add Packet Form (Split 2-Column) */}
      {activeTab === "entry" && (
        <div className="dashboard-layout">
          {/* Left Column: Form Workspace */}
          <div className="form-workspace-left">
            <div className="form-section packet-info-section">
              <div className="section-header-flat">
                <span className="section-icon">📦</span>
                <h3>Packet Base Info</h3>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Packet Code</label>
                  <input
                    type="text"
                    value={packetCode}
                    onChange={(e) => setPacketCode(e.target.value)}
                    placeholder="Enter Packet Code (e.g. PK-1)"
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Packet Image</label>
                  <div className="upload-dropzone">
                    <MdCloudUpload size={28} className="upload-icon" />
                    <span className="upload-text">Click to choose image file</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                  </div>
                  {previewPacket && (
                    <div className="image-preview-container">
                      <img src={previewPacket} alt="Packet Preview" />
                      <button
                        type="button"
                        className="remove-preview-btn"
                        onClick={() => {
                          setPacketImage("");
                          setPreviewPacket("");
                        }}
                      >
                        <MdClose size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="save-all">
              <button className="btn btn-save" onClick={handleSave} disabled={isSaving}>
                <MdSave size={18} /> {isSaving ? "Saving..." : "Save Packet"}
              </button>
              <button className="btn btn-reset" onClick={handleReset} style={{ marginLeft: "12px" }}>
                Clear Form
              </button>
            </div>
          </div>

          {/* Right Column: Live Draft Preview Panel */}
          <div className="preview-workspace-right">
            <div className="live-preview-card">
              <div className="preview-card-header">
                <span className="pulse-dot"></span>
                <h4>Live Draft Preview</h4>
              </div>

              <div className="preview-card-body">
                <div className="preview-product-info">
                  <div className="preview-product-code">
                    <span className="label">Packet Code</span>
                    <span className="value">{packetCode || "—"}</span>
                  </div>

                  <div className="preview-image-box">
                    {previewPacket ? (
                      <img src={previewPacket} alt="Packet Mockup" />
                    ) : (
                      <div className="preview-image-placeholder">
                        <span className="placeholder-icon">📦</span>
                        <span>No packet image uploaded yet</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📋 Packet List */}
      {activeTab === "list" && (
        <div className="form-section packet-list-section">
          <div className="section-header-flat">
            <div className="section-icon">📋</div>
            <h3>Saved Packet Reference List</h3>
          </div>
          {packets.length === 0 ? (
            <div className="no-products-alert">No packets configured yet. Use the tab above to add a packet reference.</div>
          ) : (
            <div className="table-responsive">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Packet Code</th>
                    <th>Packet Image</th>
                  </tr>
                </thead>
                <tbody>
                  {packets.map((p, index) => (
                    <tr key={index}>
                      <td className="product-code-cell" style={{ fontWeight: 600 }}>{p.packet_code}</td>
                      <td className="product-img-cell">
                        <div className="table-img-wrapper">
                          {p.packet_image ? (
                            <img
                              src={getImageUrl(p.packet_image)}
                              alt={p.packet_code}
                              style={{ width: "44px", height: "44px", objectFit: "contain", borderRadius: "6px" }}
                            />
                          ) : (
                            <div className="image-placeholder-badge" style={{ width: "44px", height: "44px", fontSize: "15px" }}>
                              {p.packet_code.substring(0, 3).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PacketReference;
