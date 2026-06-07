// src/pages/RawMaterialList.tsx
import React, { useEffect, useState } from "react";
import "../styles/RawMaterialEntry.css";
import { getImageUrl } from "../utils/image";

const RawMaterialList: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showMinusOnly, setShowMinusOnly] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const loadData = async () => {
    const res = await (window as any).electronAPI.getRawEntries();
    const prods = await (window as any).electronAPI.getProducts();
    setEntries(res);
    setProducts(prods);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEntries = entries.filter((e) =>
    showMinusOnly ? e.quantity < 0 : e.quantity >= 0
  );

  const handleDelete = async (id: string | number) => {
    if (confirm("🗑️ Are you sure you want to delete this entry?")) {
      await (window as any).electronAPI.deleteRawEntry(id);
      alert("✅ Deleted successfully!");
      loadData();
    }
  };

  return (
    <div className="raw-material-container">
      <h2>📋 Raw Material Entries</h2>

      <div className="toggle-filter">
        <button
          className={`toggle-btn ${!showMinusOnly ? "active" : ""}`}
          onClick={() => setShowMinusOnly(false)}
        >
          ➕ Add Entries
        </button>
        <button
          className={`toggle-btn ${showMinusOnly ? "active" : ""}`}
          onClick={() => setShowMinusOnly(true)}
        >
          ➖ Minus Entries
        </button>
      </div>

      <h3>
        {showMinusOnly ? "➖ Raw Material Used (Minus Entries)" : "➕ Added Stock Entries"}
      </h3>

      {filteredEntries.length === 0 ? (
        <p>No entries found.</p>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Part</th>
              <th>Color</th>
              <th>Color Image</th>
              <th>Qty</th>
              <th>Entry By</th>
              <th>Date</th>
              {!showMinusOnly && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((e, i) => (
              <tr key={i}>
                <td>{products.find((p) => String(p._id || p.id || "") === String(e.product_id))?.product_code}</td>
                <td>{e.part_code}</td>
                <td>
                  {(e.color_code || e.color_name) && (
                    <span>
                      {e.color_code}
                      {e.color_name ? ` (${e.color_name})` : ""}
                    </span>
                  )}
                </td>
                <td>
                  {e.color_image && (
                    <img
                      src={getImageUrl(e.color_image)}
                      alt="Uploaded"
                      width={50}
                      height={50}
                      className="clickable-thumbnail"
                      onClick={() => setPreviewModalImg(getImageUrl(e.color_image))}
                      style={{
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        objectFit: "cover",
                        background: "#fff",
                      }}
                    />
                  )}
                </td>
                <td
                  style={{
                    color: e.quantity < 0 ? "red" : "green",
                    fontWeight: 600,
                  }}
                >
                  {e.quantity}
                </td>
                <td>{e.entry_by}</td>
                <td>{new Date(e.entry_date).toLocaleString()}</td>

                {!showMinusOnly && (
                  <td>
                    <button
                      className="btn btn-delete"
                      onClick={() => handleDelete(e._id || e.id)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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

export default RawMaterialList;
