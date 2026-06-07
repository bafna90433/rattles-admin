import React, { useEffect, useState } from "react";
import "../styles/CombinationSetup.css";
import { convertToWebP } from "../utils/webp";

// Interface definitions remain the same
interface RawMaterial {
  part_code: string;
  color_code: string;
  color_name?: string;
  color_image: string; // base64
}

interface Product {
  id?: string;
  _id?: string;
  product_code: string;
  product_image: string;
  parts: { part_code: string }[];
}

interface Combination {
  id?: string;
  _id?: string;
  combo_name: string;
  product_id: string;
  product_code: string;
  parts: RawMaterial[];
  sample_image?: string;
}

const CombinationSetup: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comboName, setComboName] = useState("");
  const [availableParts, setAvailableParts] = useState<RawMaterial[]>([]);
  const [selectedParts, setSelectedParts] = useState<RawMaterial[]>([]);
  const [sampleImage, setSampleImage] = useState<string>("");
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [isListView, setIsListView] = useState(false);
  const [previewPart, setPreviewPart] = useState<RawMaterial | null>(null);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);

  // Helper to render image (handles both legacy base64 and ImageKit cloud URLs)
  const getImageUrl = (src?: string) => {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:image")) return src;
    return `data:image/png;base64,${src}`;
  };

  // 🔄 Load data functions 
  const loadProducts = async () => {
    // @ts-ignore
    const res = await window.electronAPI.getProducts();
    setProducts(res);
  };

  const loadCombinations = async () => {
    // @ts-ignore
    const res = (await window.electronAPI.getCombinations?.()) || [];
    setCombinations(res);
  };

  useEffect(() => {
    loadProducts();
    loadCombinations();
  }, []);

  const loadAvailablePartsForProduct = async (prod: Product) => {
    // @ts-ignore
    const allRawEntries = await window.electronAPI.getRawEntries();
    // @ts-ignore
    const filtered = allRawEntries.filter((r: any) => r.product_id === (prod._id || prod.id));

    const groupedParts: { [partCode: string]: RawMaterial[] } = {};
    // @ts-ignore
    filtered.forEach((r: any) => {
      if (!groupedParts[r.part_code]) groupedParts[r.part_code] = [];

      const exists = groupedParts[r.part_code].some(
        (existing: RawMaterial) =>
          existing.color_code === r.color_code &&
          existing.color_name === r.color_name &&
          existing.color_image === r.color_image
      );

      if (!exists) {
        groupedParts[r.part_code].push({
          part_code: r.part_code,
          color_code: r.color_code,
          color_name: r.color_name || "",
          color_image: r.color_image,
        });
      }
    });

    const partGroups: RawMaterial[] = [];
    Object.keys(groupedParts).forEach((partCode) => {
      groupedParts[partCode].forEach((colorOption: RawMaterial) => {
        partGroups.push(colorOption);
      });
    });

    setAvailableParts(partGroups);
  };

  // 🧩 Product select logic
  const handleProductSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    const prod = products.find((p) => (p._id || p.id) === selectedVal) || null;
    setSelectedProduct(prod);
    setSelectedParts([]);
    setPreviewPart(null);

    if (prod) {
      await loadAvailablePartsForProduct(prod);
    } else {
      setAvailableParts([]);
    }
  };

  // ✅ Select one color per part logic
  const togglePartSelection = (part: RawMaterial) => {
    const alreadySelectedForPart = selectedParts.some(
      (p) => p.part_code === part.part_code
    );

    let updatedParts;
    if (alreadySelectedForPart) {
      updatedParts = selectedParts.map((p) =>
        p.part_code === part.part_code ? part : p
      );
    } else {
      updatedParts = [...selectedParts, part];
    }

    setSelectedParts(updatedParts);
    setPreviewPart(part);
  };

  const getSelectedColorForPart = (partCode: string): string | null => {
    const selected = selectedParts.find((p) => p.part_code === partCode);
    return selected ? selected.color_code : null;
  };

  // 🖼️ Upload sample image logic
  const handleSampleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { dataUrl } = await convertToWebP(file);
      setSampleImage(dataUrl);
    }
  };

  // 💾 Save combination logic
  const handleSave = async () => {
    if (!comboName || !selectedProduct) {
      alert("⚠️ Please enter combo name and select a product!");
      return;
    }

    if (selectedProduct.parts.length > 0 && selectedParts.length !== selectedProduct.parts.length) {
      alert(`⚠️ Please select a color for all ${selectedProduct.parts.length} parts of the product! (Currently selected: ${selectedParts.length})`);
      return;
    }
    
    const comboData = {
      combo_name: comboName,
      product_id: selectedProduct._id || selectedProduct.id || "",
      product_code: selectedProduct.product_code,
      parts: selectedParts,
      sample_image: sampleImage,
    };

    try {
      if (editingComboId) {
        // @ts-ignore
        await window.electronAPI.updateCombination?.(editingComboId, comboData);
        alert("✅ Combination updated!");
      } else {
        // @ts-ignore
        await window.electronAPI.saveCombination?.(comboData);
        alert("✅ Combination saved!");
      }

      setComboName("");
      setSelectedProduct(null);
      setSelectedParts([]);
      setSampleImage("");
      setPreviewPart(null);
      setEditingComboId(null);
      loadCombinations();
      setIsListView(true);
    } catch (err) {
      console.error("Failed to save combination:", err);
      alert("❌ Error saving combination!");
    }
  };

  const startEdit = async (combo: Combination) => {
    setEditingComboId(combo._id || combo.id || null);
    setComboName(combo.combo_name);
    
    const prod = products.find((p) => p.product_code === combo.product_code) || null;
    setSelectedProduct(prod);
    setSelectedParts(combo.parts);
    setSampleImage(combo.sample_image ? getImageUrl(combo.sample_image) : "");
    setPreviewPart(combo.parts[0] || null);

    if (prod) {
      await loadAvailablePartsForProduct(prod);
    } else {
      setAvailableParts([]);
    }
    
    setIsListView(false);
  };

  const handleCancelEdit = () => {
    setComboName("");
    setSelectedProduct(null);
    setSelectedParts([]);
    setSampleImage("");
    setPreviewPart(null);
    setEditingComboId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("🗑️ Are you sure you want to delete this combination?")) {
      try {
        // @ts-ignore
        await window.electronAPI.deleteCombination(id);
        alert("🗑️ Combination deleted successfully!");
        loadCombinations();
      } catch (err) {
        console.error("Failed to delete combination:", err);
        alert("❌ Error deleting combination!");
      }
    }
  };

  const uniquePartCodes = Array.from(new Set(availableParts.map((p) => p.part_code)));

  return (
    <div className="combo-setup-container">
      <div className="header-toggle">
        <h2>{isListView ? "📋 Saved Product Combinations" : "🎨 Create New Combination"}</h2>
        <button className="toggle-btn" onClick={() => setIsListView(!isListView)}>
          {isListView ? "➕ Create New Combo" : "📋 View Saved List"}
        </button>
      </div>

      <hr />

      {/* 🧱 Create Mode */}
      {!isListView && (
        <div className="combo-builder">
          {/* LEFT: Form and Part Selection */}
          <div className="form-card left-panel">
            <div className="form-group-top">
                <div className="input-group">
                    <label>Combo Name:</label>
                    <input
                      type="text"
                      value={comboName}
                      onChange={(e) => setComboName(e.target.value)}
                      placeholder="e.g. R4-Combo-A"
                    />
                </div>
                <div className="input-group">
                    <label>Select Product:</label>
                    <select value={selectedProduct ? (selectedProduct._id || selectedProduct.id || "") : ""} onChange={handleProductSelect}>
                      <option value="">-- Select Product --</option>
                      {products.map((p) => {
                        const pId = p._id || p.id;
                        return (
                          <option key={pId} value={pId}>
                            {p.product_code}
                          </option>
                        );
                      })}
                    </select>
                </div>
            </div>
            
            <div className="parts-selection-area">
                {availableParts.length > 0 ? (
                  <>
                    <h4>🎨 Select Color for Each Part</h4>
                    <div className="parts-grid-wrapper">
                      {uniquePartCodes.map((partCode) => {
                        const partColors = availableParts.filter(
                          (p) => p.part_code === partCode
                        );
                        const selectedColor = getSelectedColorForPart(partCode);

                        return (
                          <div key={partCode} className="part-group">
                            <h5>🧩 Part: **{partCode}**</h5>
                            <div className="color-options">
                              {partColors.map((colorOption, index) => (
                                <div
                                  key={`${partCode}-${index}`}
                                  className={`color-option ${selectedColor === colorOption.color_code ? "option-selected" : ""}`}
                                  onClick={() => {
                                    togglePartSelection(colorOption);
                                    setPreviewPart(colorOption);
                                  }}
                                >
                                  <label htmlFor={`${partCode}-${colorOption.color_code}`} className="color-option-label">
                                    <input
                                        type="radio"
                                        id={`${partCode}-${colorOption.color_code}`}
                                        name={`color-${partCode}`}
                                        checked={selectedColor === colorOption.color_code}
                                        onChange={() => togglePartSelection(colorOption)}
                                        style={{ display: 'none' }} 
                                    />
                                    <div className="color-code-wrapper">
                                        <span className="color-label-code">
                                          {colorOption.color_code}
                                          {colorOption.color_name ? ` (${colorOption.color_name})` : ""}
                                        </span>
                                    </div>
                                    
                                    {colorOption.color_image && (
                                      <img
                                        src={getImageUrl(colorOption.color_image)}
                                        alt={`${colorOption.color_code} preview`}
                                        className="color-part-preview-large" 
                                      />
                                    )}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                    selectedProduct && <p className="no-parts-message">No raw entries found for product **{selectedProduct.product_code}**.</p>
                )}
            </div>

            <div className="upload-save-section">
                <div className="upload-group">
                    <label>Upload Sample Image (Optional):</label>
                    <input type="file" accept="image/*" onChange={handleSampleImage} />
                    {sampleImage && (
                      <div className="image-preview">
                        <img src={sampleImage} alt="Combo Sample" width={80} />
                      </div>
                    )}
                </div>
                <button className="btn-save" onClick={handleSave}>
                  {editingComboId ? "💾 Update Combination" : "💾 Save Combination"}
                </button>
                {editingComboId && (
                  <button className="toggle-btn" onClick={handleCancelEdit} style={{ marginLeft: "12px", background: "#6b7280" }}>
                    ✕ Cancel Edit
                  </button>
                )}
            </div>
          </div>

          {/* RIGHT: Sticky Preview Panel */}
          <div className="preview-panel sticky-panel">
            {previewPart ? (
              <>
                <h3>👀 Current Part Preview</h3>
                <div className="preview-box">
                  <img
                    src={getImageUrl(previewPart.color_image)}
                    alt={previewPart.part_code}
                    className="preview-image-large" 
                  />
                </div>
                <div className="preview-info">
                  <p><strong>Part:</strong> {previewPart.part_code}</p>
                  <p>
                    <strong>Color:</strong>{" "}
                    {previewPart.color_code}
                    {previewPart.color_name ? ` (${previewPart.color_name})` : ""}
                  </p>
                </div>
              </>
            ) : (
              <h4 className="placeholder-text">Select a part to view its image preview.</h4>
            )}

            {/* 🧩 All Selected Parts Overview */}
            {selectedParts.length > 0 && (
              <div className="selected-parts-section">
                <h3>✅ Selected Parts Overview ({selectedParts.length}/{uniquePartCodes.length})</h3>
                <div className="selected-parts-grid">
                  {selectedParts.map((p, i) => (
                    <div key={i} className="selected-part-card">
                      <img
                        src={getImageUrl(p.color_image)}
                        alt={p.part_code}
                        className="selected-part-img"
                      />
                      <p className="selected-part-label">
                        **{p.part_code}** <br />
                        <span style={{ fontWeight: 700 }}>
                          {p.color_code}
                          {p.color_name ? ` (${p.color_name})` : ""}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📋 List Mode */}
      {isListView && (
        <div className="combo-list form-card">
          {combinations.length === 0 ? (
            <p>No combinations saved yet. Switch to **Create New Combo** to begin.</p>
          ) : (
            <table className="professional-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Combo Name</th>
                  <th>Product Code</th>
                  <th>Parts & Colors</th>
                  <th>Sample Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {combinations.map((c, i) => (
                  <tr key={i}>
                    <td data-label="No.">{i + 1}</td>
                    <td data-label="Combo Name" className="combo-name-cell">**{c.combo_name}**</td>
                    <td data-label="Product">{c.product_code}</td>
                    <td data-label="Parts">
                      <div className="parts-horizontal-list">
                        {c.parts.map((p, idx) => (
                          <div key={idx} className="saved-part-item">
                            <span className="part-code-label">{p.part_code}:</span>
                             <span className="color-code-list">
                               {p.color_code}
                               {p.color_name ? ` (${p.color_name})` : ""}
                             </span>
                            {p.color_image && (
                              <img
                                src={getImageUrl(p.color_image)}
                                alt={p.part_code}
                                className="part-preview-list-img"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td data-label="Sample">
                      {c.sample_image && (
                        <img
                          src={getImageUrl(c.sample_image)}
                          alt="Sample"
                          className="sample-list-img"
                        />
                      )}
                    </td>
                    <td data-label="Actions">
                      <button className="btn-edit-action" onClick={() => startEdit(c)}>✏️ Edit</button>
                      <button className="btn-delete-action" onClick={() => handleDelete(c._id || c.id || "")}>🗑️ Delete</button>
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

export default CombinationSetup;