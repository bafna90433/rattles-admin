import React, { useState, ChangeEvent, useEffect } from "react";
import {
  MdAdd,
  MdEdit,
  MdDeleteOutline,
  MdVisibility,
  MdVisibilityOff,
  MdCloudUpload,
  MdSave,
  MdClose
} from "react-icons/md";
import "../styles/ProductReference.css";

import { convertToWebP } from "../utils/webp";

interface Part {
  part_code: string;
  part_image: string;
}

interface Product {
  id?: string;
  _id?: string;
  product_code: string;
  product_image: string;
  parts: Part[];
}

// Helper to render image (handles both legacy base64 and ImageKit cloud URLs)
const getImageUrl = (src?: string) => {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:image")) return src;
  return `data:image/png;base64,${src}`;
};

const ProductReference: React.FC = () => {
  const [product, setProduct] = useState<Product>({
    product_code: "",
    product_image: "",
    parts: [],
  });

  const [previewProduct, setPreviewProduct] = useState<string>("");
  const [newPart, setNewPart] = useState<Part>({ part_code: "", part_image: "" });
  const [previewPart, setPreviewPart] = useState<string>("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Handle product image
  const handleProductImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { base64, dataUrl } = await convertToWebP(file);
      setProduct((prev) => ({ ...prev, product_image: base64 }));
      setPreviewProduct(dataUrl);
    }
  };

  // Handle part image
  const handlePartImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { base64, dataUrl } = await convertToWebP(file);
      setNewPart((prev) => ({ ...prev, part_image: base64 }));
      setPreviewPart(dataUrl);
    }
  };

  // Add Part
  const handleAddPart = () => {
    if (!newPart.part_code || !newPart.part_image) {
      alert("⚠️ Please add part code and image!");
      return;
    }
    setProduct((prev) => ({ ...prev, parts: [...prev.parts, newPart] }));
    setNewPart({ part_code: "", part_image: "" });
    setPreviewPart("");
  };

  // Remove Part
  const handleRemovePart = (index: number) => {
    const updated = product.parts.filter((_, i) => i !== index);
    setProduct((prev) => ({ ...prev, parts: updated }));
  };

  // Save or Update Product
  const handleSaveProduct = async () => {
    if (!product.product_code || !product.product_image) {
      alert("⚠️ Please enter Product Code and Image!");
      return;
    }

    setIsSaving(true);
    try {
      let result;
      if (editMode && (product.id || product._id)) {
        result = await (window as any).electronAPI.updateProduct(product);
      } else {
        result = await (window as any).electronAPI.saveProduct(product);
      }

      alert(result);
      setEditMode(false);
      setProduct({ product_code: "", product_image: "", parts: [] });
      setPreviewProduct("");
      loadProducts();
      setActiveTab("list");
    } catch (err: any) {
      alert("❌ Save error: " + (err.message || "Failed to save product"));
    } finally {
      setIsSaving(false);
    }
  };

  // Edit Product
  const handleEditProduct = (p: Product) => {
    setProduct(p);
    setPreviewProduct(getImageUrl(p.product_image));
    setEditMode(true);
    setActiveTab("entry");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete Product
  const handleDeleteProduct = async (id?: string) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this product?")) {
      const result = await (window as any).electronAPI.deleteProduct(id);
      alert(result);
      loadProducts();
    }
  };

  // Load All Products
  const loadProducts = async () => {
    const result = await (window as any).electronAPI.getProducts();
    setAllProducts(result);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Utility to render images (supports HTTP/HTTPS URLs and base64 strings)
  const renderProductImage = (imageStr: string, code: string, size: number = 44) => {
    const srcUrl = getImageUrl(imageStr);
    if (!srcUrl) {
      return (
        <div className="image-placeholder-badge" style={{ width: size, height: size, fontSize: size * 0.35 }}>
          {code.substring(0, 3).toUpperCase()}
        </div>
      );
    }

    return (
      <img
        src={srcUrl}
        alt={code}
        style={{ width: size, height: size, objectFit: "contain", borderRadius: "6px" }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const parent = target.parentNode as HTMLElement;
          if (parent) {
            if (!parent.querySelector(".image-placeholder-badge")) {
              const fallback = document.createElement("div");
              fallback.className = "image-placeholder-badge";
              fallback.style.width = `${size}px`;
              fallback.style.height = `${size}px`;
              fallback.style.fontSize = `${size * 0.35}px`;
              fallback.innerText = code.substring(0, 3).toUpperCase();
              parent.appendChild(fallback);
            }
          }
        }}
      />
    );
  };

  return (
    <div className="product-reference-container">
      {/* 🧭 Page Header */}
      <div className="product-ref-header">
        <div className="header-info">
          <h2>Product Reference Manager</h2>
          <p>Configure product definitions, images, and map component parts for inventory tracking.</p>
        </div>
      </div>

      {/* 🔀 Segmented Control Tab Switcher */}
      <div className="segmented-control-container">
        <div className="segmented-control">
          <button
            className={`segmented-btn ${activeTab === "entry" ? "active" : ""}`}
            onClick={() => setActiveTab("entry")}
          >
            {editMode ? "✏️ Edit Product Details" : "➕ Add New Product"}
          </button>
          <button
            className={`segmented-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            📋 Product Reference List
          </button>
        </div>
      </div>

      {/* 🧾 Product Entry Form */}
      {activeTab === "entry" && (
        <div className="dashboard-layout">
          {/* Left Column: Form Workspace */}
          <div className="form-workspace-left">
            {/* Section: Product Info */}
            <div className="form-section product-info-section">
              <div className="section-header-flat">
                <span className="section-icon">🧱</span>
                <h3>{editMode ? "Edit Product Info" : "Product Base Info"}</h3>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Product Code</label>
                  <input
                    type="text"
                    value={product.product_code}
                    onChange={(e) => setProduct({ ...product, product_code: e.target.value })}
                    placeholder="Enter Product Code (e.g. R4)"
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Product Image</label>
                  <div className="upload-dropzone">
                    <MdCloudUpload size={28} className="upload-icon" />
                    <span className="upload-text">Click to choose image file</span>
                    <input type="file" accept="image/*" onChange={handleProductImage} />
                  </div>
                  {previewProduct && (
                    <div className="image-preview-container">
                      <img src={previewProduct} alt="Product Preview" />
                      <button
                        type="button"
                        className="remove-preview-btn"
                        onClick={() => {
                          setProduct(prev => ({ ...prev, product_image: "" }));
                          setPreviewProduct("");
                        }}
                      >
                        <MdClose size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Map Component Parts */}
            <div className="form-section parts-mapping-section">
              <div className="section-header-flat">
                <span className="section-icon">🧩</span>
                <h3>Map Component Parts</h3>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Part Code</label>
                  <input
                    type="text"
                    value={newPart.part_code}
                    onChange={(e) => setNewPart({ ...newPart, part_code: e.target.value })}
                    placeholder="Enter Part Code (e.g. R4-A)"
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Part Image</label>
                  <div className="upload-dropzone compact">
                    <MdCloudUpload size={20} className="upload-icon" />
                    <span className="upload-text">Choose Part File</span>
                    <input type="file" accept="image/*" onChange={handlePartImage} />
                  </div>
                  {previewPart && (
                    <div className="image-preview-container compact">
                      <img src={previewPart} alt="Part Preview" />
                      <span className="preview-filename">{newPart.part_code || "Selected Part Image"}</span>
                      <button
                        type="button"
                        className="remove-preview-btn"
                        onClick={() => {
                          setNewPart(prev => ({ ...prev, part_image: "" }));
                          setPreviewPart("");
                        }}
                      >
                        <MdClose size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row-actions">
                <button className="btn btn-add" onClick={handleAddPart}>
                  <MdAdd size={18} /> Add Component Part
                </button>
              </div>

              {product.parts.length > 0 && (
                <div className="parts-list-section">
                  <h4>Mapped Component Parts ({product.parts.length})</h4>
                  <div className="parts-grid-chips">
                    {product.parts.map((part, index) => (
                      <div className="part-chip" key={index}>
                        <div className="part-chip-img-wrapper">
                          {renderProductImage(part.part_image, part.part_code, 28)}
                        </div>
                        <span className="part-chip-code">{part.part_code}</span>
                        <button
                          type="button"
                          className="part-chip-remove"
                          onClick={() => handleRemovePart(index)}
                          title="Remove part"
                        >
                          <MdClose size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

             <div className="save-all">
              <button className="btn btn-save" onClick={handleSaveProduct} disabled={isSaving}>
                <MdSave size={18} /> {isSaving ? "Saving..." : editMode ? "Update Product & Components" : "Save Product with Parts"}
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
                    <span className="label">Product Code</span>
                    <span className="value">{product.product_code || "—"}</span>
                  </div>

                  <div className="preview-image-box">
                    {previewProduct ? (
                      <img src={previewProduct} alt="Product Mockup" />
                    ) : (
                      <div className="preview-image-placeholder">
                        <span className="placeholder-icon">🧱</span>
                        <span>No product image uploaded yet</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="preview-parts-section">
                  <div className="preview-parts-header">
                    <span>Component Parts List</span>
                    <span className="preview-parts-count">{product.parts.length} Parts</span>
                  </div>

                  {product.parts.length === 0 ? (
                    <div className="preview-parts-empty">
                      No components added yet. Use the form to map parts.
                    </div>
                  ) : (
                    <div className="preview-parts-grid">
                      {product.parts.map((part, idx) => (
                        <div key={idx} className="preview-part-thumb-card">
                          <div className="preview-part-img-container">
                            {renderProductImage(part.part_image, part.part_code, 36)}
                          </div>
                          <span className="preview-part-code">{part.part_code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📋 Product List */}
      {activeTab === "list" && (
        <div className="form-section product-list-section">
          <div className="section-header-flat">
            <div className="section-icon">📋</div>
            <h3>Saved Product Reference List</h3>
          </div>
          {allProducts.length === 0 ? (
            <div className="no-products-alert">No products configured yet. Use the tab above to add a product reference.</div>
          ) : (
            <div className="table-responsive">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Product Image</th>
                    <th>Components</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allProducts.map((p, index) => {
                    const pId = p._id || p.id;
                    const isExpanded = expandedProduct === pId;
                    return (
                      <React.Fragment key={index}>
                        <tr className={isExpanded ? "row-expanded-header" : ""}>
                          <td className="product-code-cell">{p.product_code}</td>
                          <td className="product-img-cell">
                            <div className="table-img-wrapper">
                              {renderProductImage(p.product_image, p.product_code, 44)}
                            </div>
                          </td>
                          <td>
                            <span className="parts-badge">
                              {p.parts?.length || 0} Components
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="action-buttons-group">
                              <button
                                className={`action-btn btn-view ${isExpanded ? "active" : ""}`}
                                onClick={() =>
                                  setExpandedProduct(isExpanded ? null : (pId ?? null))
                                }
                                title={isExpanded ? "Hide components" : "View components"}
                              >
                                {isExpanded ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                <span>{isExpanded ? "Hide" : "View Parts"}</span>
                              </button>
                              <button
                                className="action-btn btn-edit"
                                onClick={() => handleEditProduct(p)}
                                title="Edit product reference"
                              >
                                <MdEdit size={18} />
                                <span>Edit</span>
                              </button>
                              <button
                                className="action-btn btn-delete"
                                onClick={() => handleDeleteProduct(pId)}
                                title="Delete product reference"
                              >
                                <MdDeleteOutline size={18} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Parts Grid */}
                        {isExpanded && (
                          <tr className="expanded-parts-row">
                            <td colSpan={4}>
                              <div className="expanded-parts-container">
                                <div className="expanded-parts-title">🧩 Component Part Mapping for {p.product_code}</div>
                                {p.parts.length === 0 ? (
                                  <div className="no-parts-alert">No parts mapped to this product yet.</div>
                                ) : (
                                  <div className="parts-grid-expanded">
                                    {p.parts.map((part, i) => (
                                      <div key={i} className="part-card-expanded">
                                        <div className="expanded-part-img-wrapper">
                                          {renderProductImage(part.part_image, part.part_code, 60)}
                                        </div>
                                        <span className="expanded-part-code">{part.part_code}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductReference;
