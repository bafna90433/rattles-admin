import React, { useState, useEffect } from "react";
import "../styles/PacketCombination.css";
import { convertToWebP } from "../utils/webp";

const PacketCombination: React.FC = () => {
  const [packets, setPackets] = useState<any[]>([]);
  const [producedProducts, setProducedProducts] = useState<any[]>([]);
  const [combinations, setCombinations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedPacket, setSelectedPacket] = useState("");
  const [selectedPacketImage, setSelectedPacketImage] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sampleImage, setSampleImage] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");

  const [isListView, setIsListView] = useState(true);

  // Helper to render image (handles both legacy base64 and ImageKit cloud URLs)
  const getImageUrl = (src?: string) => {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:image")) return src;
    return `data:image/png;base64,${src}`;
  };

  // 🧭 Load all data (packets, produced items, existing combinations)
  const loadAll = async () => {
    setLoading(true);
    try {
      const p1 = await (window as any).electronAPI.getPackets?.();
      const p2 = await (window as any).electronAPI.getProducedProducts?.();
      const p3 = await (window as any).electronAPI.getPacketCombinations?.();

      setPackets(p1 || []);
      setProducedProducts(p2 || []);
      setCombinations(p3 || []);
    } catch (err) {
      console.error("❌ Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // 🧩 Packet select → show image
  const handlePacketSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedPacket(code);
    const pkt = packets.find((p) => p.packet_code === code);
    setSelectedPacketImage(pkt?.packet_image || "");
  };

  // 📸 Upload sample image
  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { base64 } = await convertToWebP(file);
      setSampleImage(base64);
    }
  };

  // ✅ Toggle product selection
  const toggleProduct = (code: string) => {
    setSelectedProducts((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  // 💾 Save combination
  const handleSave = async () => {
    if (!selectedPacket || selectedProducts.length === 0 || !groupName) {
      alert("⚠️ Please enter Group Name, select a Packet, and choose Products!");
      return;
    }

    const res = await (window as any).electronAPI.savePacketCombination?.({
      group_name: groupName.trim(),
      packet_code: selectedPacket,
      products: selectedProducts,
      sample_image: sampleImage,
    });

    alert(res || "✅ Packet Combination Saved!");
    setGroupName("");
    setSelectedPacket("");
    setSelectedProducts([]);
    setSampleImage("");
    setSelectedPacketImage("");
    await loadAll();
    setIsListView(true);
  };

  return (
    <div className="packet-combination-container">
      {/* Header */}
      <div className="header-toggle">
        <h2>
          {isListView
            ? "📦 All Packet Combinations"
            : "🧩 Create New Packet Combination"}
        </h2>
        <button
          className="toggle-btn"
          onClick={() => setIsListView(!isListView)}
        >
          {isListView ? "➕ Create New" : "📋 View List"}
        </button>
      </div>

      {/* 🔄 Loader */}
      {loading && (
        <p className="loading-text">⏳ Loading data, please wait...</p>
      )}

      {/* 🧱 CREATE MODE */}
      {!isListView && !loading && (
        <div className="packet-combo-card">
          {/* 🏷️ Group Name */}
          <label>Group Name:</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name (e.g. Toy Gift Pack)"
          />

          {/* Select Packet */}
          <label>Select Packet:</label>
          <select value={selectedPacket} onChange={handlePacketSelect}>
            <option value="">-- Select Packet --</option>
            {packets.map((p, i) => (
              <option key={i} value={p.packet_code}>
                {p.packet_code}
              </option>
            ))}
          </select>

          {/* 🖼️ Packet Image */}
          {selectedPacketImage && (
            <div className="image-preview">
              <p className="preview-label">Packet Image Preview:</p>
              <img
                src={getImageUrl(selectedPacketImage)}
                alt="Selected Packet"
              />
            </div>
          )}

          {/* Product List */}
          <label>Select Products (from Produced Stock):</label>
          <div className="product-list">
            {producedProducts.length === 0 ? (
              <p className="empty-msg">
                ⚠️ No produced products available. Please produce something first.
              </p>
            ) : (
              producedProducts.map((prod, i) => (
                <div
                  key={i}
                  className={`product-card ${
                    selectedProducts.includes(prod.product_code)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => toggleProduct(prod.product_code)}
                >
                  <img
                    src={getImageUrl(prod.product_image)}
                    alt={prod.product_code}
                  />
                  <p>
                    {prod.product_code}
                    <br />
                    <small style={{ color: "#2563eb", fontSize: "12px" }}>
                      Qty: {prod.total_qty}
                    </small>
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Upload Sample Image */}
          <label>Upload Sample Packet Image:</label>
          <input type="file" accept="image/*" onChange={handleImage} />
          {sampleImage && (
            <div className="image-preview">
              <p className="preview-label">Sample Packet Preview:</p>
              <img src={getImageUrl(sampleImage)} alt="Sample" />
            </div>
          )}

          <button onClick={handleSave} className="btn-save">
            💾 Save Packet Combination
          </button>
        </div>
      )}

      {/* 📋 LIST MODE */}
      {isListView && !loading && (
        <div className="packet-combo-list">
          {combinations.length === 0 ? (
            <p className="empty-msg">
              🚫 No packet combinations found yet. Click "➕ Create New" to add one.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Sample</th>
                  <th>Group Name</th>
                  <th>Packet Code</th>
                  <th>Products</th>
                </tr>
              </thead>
              <tbody>
                {combinations.map((c, i) => (
                  <tr key={i}>
                    {/* Sample image */}
                    <td>
                      {c.sample_image ? (
                        <img
                          src={getImageUrl(c.sample_image)}
                          alt="Sample"
                          width={60}
                          height={60}
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            objectFit: "cover",
                            background: "#fff",
                          }}
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Group + Packet */}
                    <td style={{ fontWeight: 600 }}>{c.group_name}</td>
                    <td>{c.packet_code}</td>

                    {/* Products with images */}
                    <td style={{ minWidth: "180px" }}>
                      {c.product_images && c.product_images.length > 0 ? (
                        c.product_images.map((p: any, idx: number) => (
                          <span
                            key={idx}
                            title={p.product_code}
                            style={{
                              display: "inline-block",
                              margin: "4px",
                              textAlign: "center",
                              verticalAlign: "top",
                            }}
                          >
                            {p.product_image ? (
                              <img
                                src={getImageUrl(p.product_image)}
                                alt={p.product_code}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "6px",
                                  objectFit: "cover",
                                  border: "1px solid #ccc",
                                  transition: "transform 0.2s ease",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.transform = "scale(1.3)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.transform = "scale(1)")
                                }
                              />
                            ) : (
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  background: "#f3f4f6",
                                  borderRadius: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "10px",
                                  color: "#666",
                                  border: "1px solid #ddd",
                                }}
                              >
                                No Img
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#1e3a8a",
                                marginTop: "2px",
                              }}
                            >
                              {p.product_code}
                            </div>
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#999" }}>No products</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default PacketCombination;
