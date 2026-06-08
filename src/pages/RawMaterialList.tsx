import React, { useEffect, useState } from "react";
import "../styles/RawMaterialEntry.css";
import { getImageUrl } from "../utils/image";
import {
  MdAdd,
  MdDeleteOutline,
  MdRemove,
  MdSearchOff,
  MdTrendingDown,
  MdTrendingUp,
} from "react-icons/md";

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
  const addEntries = entries.filter((e) => e.quantity >= 0);
  const minusEntries = entries.filter((e) => e.quantity < 0);
  const totalAdded = addEntries.reduce((sum, e) => sum + Number(e.quantity || 0), 0);
  const totalUsed = Math.abs(minusEntries.reduce((sum, e) => sum + Number(e.quantity || 0), 0));

  const handleDelete = async (id: string | number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await (window as any).electronAPI.deleteRawEntry(id);
      alert("Deleted successfully!");
      loadData();
    }
  };

  const getProductCode = (productId: string | number) =>
    products.find((p) => String(p._id || p.id || "") === String(productId))?.product_code || "-";

  return (
    <div className="raw-material-container">
      <div className="raw-list-header">
        <div>
          <p className="raw-list-kicker">Inventory Ledger</p>
          <h1>Raw Material Entries</h1>
          <span>Track added and consumed raw material entries by product, part and color.</span>
        </div>
        <div className="raw-list-metrics">
          <div className="raw-list-metric">
            <small>Added Qty</small>
            <strong>{totalAdded.toLocaleString("en-IN")}</strong>
          </div>
          <div className="raw-list-metric danger">
            <small>Used Qty</small>
            <strong>{totalUsed.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      <div className="toggle-filter raw-entry-toggle" role="tablist" aria-label="Entry type">
        <button
          className={`toggle-btn ${!showMinusOnly ? "active" : ""}`}
          onClick={() => setShowMinusOnly(false)}
          type="button"
          role="tab"
          aria-selected={!showMinusOnly}
        >
          <MdAdd size={18} />
          Add Entries
        </button>
        <button
          className={`toggle-btn ${showMinusOnly ? "active" : ""}`}
          onClick={() => setShowMinusOnly(true)}
          type="button"
          role="tab"
          aria-selected={showMinusOnly}
        >
          <MdRemove size={18} />
          Minus Entries
        </button>
      </div>

      <div className="raw-entry-panel">
        <div className="raw-entry-panel-heading">
          <div>
            <h2>
              {showMinusOnly ? (
                <>
                  <MdTrendingDown size={22} />
                  Raw Material Used
                </>
              ) : (
                <>
                  <MdTrendingUp size={22} />
                  Added Stock Entries
                </>
              )}
            </h2>
            <span>{filteredEntries.length.toLocaleString("en-IN")} records</span>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="raw-entry-empty">
            <MdSearchOff size={28} />
            <p>No entries found.</p>
          </div>
        ) : (
          <div className="raw-entry-table-wrap">
            <table className="product-table raw-entry-table">
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
                    <td className="raw-product-code">{getProductCode(e.product_id)}</td>
                    <td>{e.part_code}</td>
                    <td>
                      {e.color_code || e.color_name ? (
                        <span className="raw-color-chip">
                          {e.color_code}
                          {e.color_name ? ` (${e.color_name})` : ""}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {e.color_image ? (
                        <img
                          src={getImageUrl(e.color_image)}
                          alt="Uploaded"
                          width={50}
                          height={50}
                          className="clickable-thumbnail raw-entry-thumbnail"
                          onClick={() => setPreviewModalImg(getImageUrl(e.color_image))}
                        />
                      ) : (
                        <span className="raw-image-empty">No image</span>
                      )}
                    </td>
                    <td>
                      <span className={`raw-qty-pill ${e.quantity < 0 ? "minus" : "plus"}`}>
                        {Number(e.quantity || 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>{e.entry_by || "-"}</td>
                    <td>{new Date(e.entry_date).toLocaleString("en-IN")}</td>
                    {!showMinusOnly && (
                      <td>
                        <button
                          className="btn btn-delete raw-delete-btn"
                          onClick={() => handleDelete(e._id || e.id)}
                          type="button"
                        >
                          <MdDeleteOutline size={18} />
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

export default RawMaterialList;
