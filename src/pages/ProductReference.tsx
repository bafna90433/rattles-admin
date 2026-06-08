import React, { useState, ChangeEvent, useEffect } from "react";
import {
  MdAdd,
  MdEdit,
  MdDeleteOutline,
  MdVisibility,
  MdVisibilityOff,
  MdCloudUpload,
  MdSave,
  MdClose,
  MdSearch,
  MdInventory2,
  MdCategory,
  MdWidgets,
  MdOutlineAutoAwesome,
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>("");

  const handleProductImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { base64, dataUrl } = await convertToWebP(file);
      setProduct((prev) => ({ ...prev, product_image: base64 }));
      setPreviewProduct(dataUrl);
    }
  };

  const handlePartImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { base64, dataUrl } = await convertToWebP(file);
      setNewPart((prev) => ({ ...prev, part_image: base64 }));
      setPreviewPart(dataUrl);
    }
  };

  const handleAddPart = () => {
    if (!newPart.part_code || !newPart.part_image) {
      alert("Please add part code and image.");
      return;
    }
    setProduct((prev) => ({ ...prev, parts: [...prev.parts, newPart] }));
    setNewPart({ part_code: "", part_image: "" });
    setPreviewPart("");
  };

  const handleRemovePart = (index: number) => {
    const updated = product.parts.filter((_, i) => i !== index);
    setProduct((prev) => ({ ...prev, parts: updated }));
  };

  const handleSaveProduct = async () => {
    if (!product.product_code || !product.product_image) {
      alert("Please enter Product Code and Product Image.");
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
      alert("Save error: " + (err.message || "Failed to save product"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProduct = (p: Product) => {
    setProduct(p);
    setPreviewProduct(getImageUrl(p.product_image));
    setEditMode(true);
    setActiveTab("entry");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProduct = async (id?: string) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this product?")) {
      const result = await (window as any).electronAPI.deleteProduct(id);
      alert(result);
      loadProducts();
    }
  };

  const loadProducts = async () => {
    const result = await (window as any).electronAPI.getProducts();
    setAllProducts(result);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const renderProductImage = (
    imageStr: string,
    code: string,
    size: number = 44,
    clickable: boolean = false,
  ) => {
    const srcUrl = getImageUrl(imageStr);
    if (!srcUrl) {
      return (
        <div className="image-placeholder-badge" style={{ width: size, height: size, fontSize: size * 0.35 }}>
          {(code || "NA").substring(0, 3).toUpperCase()}
        </div>
      );
    }

    return (
      <img
        src={srcUrl}
        alt={code}
        className={clickable ? "clickable-thumbnail" : ""}
        onClick={clickable ? () => {
          setPreviewModalImg(srcUrl);
          setPreviewModalTitle(code);
        } : undefined}
        style={{ width: size, height: size, objectFit: "contain", borderRadius: "10px" }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const parent = target.parentNode as HTMLElement;
          if (parent && !parent.querySelector(".image-placeholder-badge")) {
            const fallback = document.createElement("div");
            fallback.className = "image-placeholder-badge";
            fallback.style.width = `${size}px`;
            fallback.style.height = `${size}px`;
            fallback.style.fontSize = `${size * 0.35}px`;
            fallback.innerText = (code || "NA").substring(0, 3).toUpperCase();
            parent.appendChild(fallback);
          }
        }}
      />
    );
  };

  const filteredProducts = allProducts.filter((p) => {
    const code = p.product_code.toLowerCase();
    const query = searchQuery.toLowerCase();
    const hasPart = p.parts?.some((part) => part.part_code.toLowerCase().includes(query));
    return code.includes(query) || hasPart;
  });

  const totalParts = allProducts.reduce((sum, item) => sum + (item.parts?.length || 0), 0);
  return (
    <div className="product-reference-container">
      <section className="product-ref-hero">
        <div className="product-ref-hero-copy">
          <h2>{editMode ? "Edit product reference" : "Product reference"}</h2>
          <p>
            Add product image, map component parts, and manage saved references from one simple workspace.
          </p>
          <div className="hero-summary">
            <span>{allProducts.length} products</span>
            <span>{totalParts} parts linked</span>
          </div>
        </div>
      </section>

      <div className="segmented-control-container">
        <div className="segmented-control">
          <button
            className={`segmented-btn ${activeTab === "entry" ? "active" : ""}`}
            onClick={() => setActiveTab("entry")}
          >
            <MdOutlineAutoAwesome size={17} />
            <span>{editMode ? "Edit Product" : "Create Product"}</span>
          </button>
          <button
            className={`segmented-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <MdInventory2 size={17} />
            <span>Reference Library</span>
          </button>
        </div>
      </div>

      {activeTab === "entry" && (
        <div className="dashboard-layout">
          <div className="form-workspace-left">
            <div className="form-section product-info-section">
              <div className="section-header-flat">
                <span className="section-icon"><MdCategory size={20} /></span>
                <div>
                  <h3>{editMode ? "Edit product base" : "Product base info"}</h3>
                  <p>Start with a short code and one clean reference image.</p>
                </div>
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
                    <span className="upload-text">Choose hero image</span>
                    <small>PNG, JPG, or WebP</small>
                    <input type="file" accept="image/*" onChange={handleProductImage} />
                  </div>
                  {previewProduct && (
                    <div className="image-preview-container">
                      <img
                        src={previewProduct}
                        alt="Product Preview"
                        className="clickable-thumbnail"
                        onClick={() => {
                          setPreviewModalImg(previewProduct);
                          setPreviewModalTitle(product.product_code || "Product Image");
                        }}
                      />
                      <span className="preview-filename">{product.product_code || "Selected product image"}</span>
                      <button
                        type="button"
                        className="remove-preview-btn"
                        onClick={() => {
                          setProduct((prev) => ({ ...prev, product_image: "" }));
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

            <div className="form-section parts-mapping-section">
              <div className="section-header-flat">
                <span className="section-icon"><MdWidgets size={20} /></span>
                <div>
                  <h3>Map component parts</h3>
                  <p>Add each part with a distinct code so stock teams can identify it fast.</p>
                </div>
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
                    <span className="upload-text">Choose part file</span>
                    <input type="file" accept="image/*" onChange={handlePartImage} />
                  </div>
                  {previewPart && (
                    <div className="image-preview-container compact">
                      <img src={previewPart} alt="Part Preview" />
                      <span className="preview-filename">{newPart.part_code || "Selected part image"}</span>
                      <button
                        type="button"
                        className="remove-preview-btn"
                        onClick={() => {
                          setNewPart((prev) => ({ ...prev, part_image: "" }));
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
                  <div className="parts-list-head">
                    <h4>Mapped parts</h4>
                    <span>{product.parts.length} linked</span>
                  </div>
                  <div className="parts-grid-chips">
                    {product.parts.map((part, index) => (
                      <div className="part-chip" key={index}>
                        <div
                          className="part-chip-img-wrapper clickable-thumbnail"
                          onClick={() => {
                            const srcUrl = getImageUrl(part.part_image);
                            if (srcUrl) {
                              setPreviewModalImg(srcUrl);
                              setPreviewModalTitle(part.part_code);
                            }
                          }}
                        >
                          {renderProductImage(part.part_image, part.part_code, 34)}
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
                <MdSave size={18} />
                {isSaving ? "Saving..." : editMode ? "Update Product & Components" : "Save Product with Parts"}
              </button>
            </div>
          </div>

          <div className="preview-workspace-right">
            <div className="live-preview-card">
              <div className="preview-card-header">
                <div className="preview-card-title">
                  <span className="pulse-dot"></span>
                  <h4>Live draft preview</h4>
                </div>
                <span className="preview-status">{product.parts.length} parts attached</span>
              </div>

              <div className="preview-card-body">
                <div className="preview-spotlight">
                  <div className="preview-product-code">
                    <span className="label">Product Code</span>
                    <span className="value">{product.product_code || "Awaiting code"}</span>
                  </div>

                  <div className="preview-image-box">
                    {previewProduct ? (
                      <img
                        src={previewProduct}
                        alt="Product Mockup"
                        className="clickable-thumbnail"
                        onClick={() => {
                          setPreviewModalImg(previewProduct);
                          setPreviewModalTitle(product.product_code || "Product Preview");
                        }}
                      />
                    ) : (
                      <div className="preview-image-placeholder">
                        <span className="placeholder-icon"><MdCategory size={34} /></span>
                        <span>No product image uploaded yet</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="preview-parts-section">
                  <div className="preview-parts-header">
                    <span>Component parts</span>
                    <span className="preview-parts-count">{product.parts.length}</span>
                  </div>

                  {product.parts.length === 0 ? (
                    <div className="preview-parts-empty">
                      Your mapped components will appear here as a quick visual checklist.
                    </div>
                  ) : (
                    <div className="preview-parts-grid">
                      {product.parts.map((part, idx) => (
                        <div
                          key={idx}
                          className="preview-part-thumb-card clickable-thumbnail"
                          onClick={() => {
                            const srcUrl = getImageUrl(part.part_image);
                            if (srcUrl) {
                              setPreviewModalImg(srcUrl);
                              setPreviewModalTitle(part.part_code);
                            }
                          }}
                        >
                          <div className="preview-part-img-container">
                            {renderProductImage(part.part_image, part.part_code, 42)}
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

      {activeTab === "list" && (
        <div className="form-section product-list-section">
          <div className="list-topbar">
            <div className="section-header-flat">
              <div className="section-icon"><MdInventory2 size={20} /></div>
              <div>
                <h3>Saved product reference library</h3>
                <p>Search, inspect, edit, or open component mappings for each saved product.</p>
              </div>
            </div>

            <div className="search-input-wrapper">
              <MdSearch size={20} className="search-icon" />
              <input
                type="text"
                className="input-search"
                placeholder="Search by product code or component part..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {allProducts.length === 0 ? (
            <div className="no-products-alert">No products configured yet. Use the create view to add a new reference.</div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products-alert">No matching products found for your search.</div>
          ) : (
            <div className="product-library-grid">
              {filteredProducts.map((p, index) => {
                const pId = p._id || p.id;
                const isExpanded = expandedProduct === pId;
                return (
                  <article className={`product-library-card ${isExpanded ? "expanded" : ""}`} key={index}>
                    <div className="product-library-main">
                      <div className="product-library-media">
                        {renderProductImage(p.product_image, p.product_code, 72, true)}
                      </div>

                      <div className="product-library-copy">
                        <div className="product-library-meta">
                          <span className="library-label">Product</span>
                          <h4>{p.product_code}</h4>
                        </div>
                        <p>{p.parts?.length || 0} mapped component{(p.parts?.length || 0) === 1 ? "" : "s"} ready for stock operations.</p>
                        <div className="library-badges">
                          <span className="parts-badge">{p.parts?.length || 0} Components</span>
                          <span className="library-soft-badge">{p.product_image ? "Image ready" : "Image missing"}</span>
                        </div>
                      </div>

                      <div className="action-buttons-group">
                        <button
                          className={`action-btn btn-view ${isExpanded ? "active" : ""}`}
                          onClick={() => setExpandedProduct(isExpanded ? null : (pId ?? null))}
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
                    </div>

                    {isExpanded && (
                      <div className="expanded-parts-container">
                        <div className="expanded-parts-title">Component mapping for {p.product_code}</div>
                        {p.parts.length === 0 ? (
                          <div className="no-parts-alert">No parts mapped to this product yet.</div>
                        ) : (
                          <div className="parts-grid-expanded">
                            {p.parts.map((part, i) => (
                              <div key={i} className="part-card-expanded">
                                <div className="expanded-part-img-wrapper">
                                  {renderProductImage(part.part_image, part.part_code, 66, true)}
                                </div>
                                <span className="expanded-part-code">{part.part_code}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {previewModalImg && (
        <div className="image-preview-modal-overlay" onClick={() => setPreviewModalImg(null)}>
          <div className="image-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview-modal" onClick={() => setPreviewModalImg(null)}>x</button>
            <img src={previewModalImg} alt="Preview" />
            <div className="modal-title">{previewModalTitle}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReference;
