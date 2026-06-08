import React, { useEffect, useMemo, useState } from "react";
import { MdCloudUpload, MdImage, MdRefresh, MdSave } from "react-icons/md";
import "../styles/Settings.css";

type WorkflowKey = "materials" | "production" | "packing" | "dispatch";

interface WorkflowImageSetting {
  key: WorkflowKey;
  title: string;
  image_url: string;
  updated_at?: string;
}

const fallbackImages: Record<WorkflowKey, string> = {
  materials: "/assets/workflow/rattle-material.png",
  production: "/assets/workflow/rattle-production.png",
  packing: "/assets/workflow/rattle-packing.png",
  dispatch: "/assets/workflow/rattle-dispatch.png",
};

const defaultSlots: WorkflowImageSetting[] = [
  { key: "materials", title: "Materials", image_url: "" },
  { key: "production", title: "Rattle Build", image_url: "" },
  { key: "packing", title: "Packet Assembly", image_url: "" },
  { key: "dispatch", title: "Dispatch / Sales", image_url: "" },
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Settings: React.FC = () => {
  const [items, setItems] = useState<WorkflowImageSetting[]>(defaultSlots);
  const [draftImages, setDraftImages] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const imageCount = useMemo(
    () => items.filter((item) => item.image_url || draftImages[item.key]).length,
    [items, draftImages]
  );

  const loadSettings = async () => {
    setStatus("Loading settings...");
    try {
      const res = await (window as any).electronAPI.getDashboardSettings?.();
      setItems(res?.workflowImages?.length ? res.workflowImages : defaultSlots);
      setStatus("");
    } catch (err: any) {
      setStatus(err?.message || "Unable to load dashboard settings.");
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleFileChange = async (key: WorkflowKey, file?: File | null) => {
    if (!file) return;
    const base64 = await fileToBase64(file);
    setDraftImages((prev) => ({ ...prev, [key]: base64 }));
  };

  const saveImage = async (item: WorkflowImageSetting) => {
    const image = draftImages[item.key];
    if (!image) {
      setStatus("Please choose an image before saving.");
      return;
    }

    setSavingKey(item.key);
    setStatus("Uploading image to ImageKit...");
    try {
      const res = await (window as any).electronAPI.updateWorkflowImage?.(item.key, {
        title: item.title,
        image,
      });
      setItems(res?.workflowImages || items);
      setDraftImages((prev) => {
        const next = { ...prev };
        delete next[item.key];
        return next;
      });
      setStatus("Dashboard image updated successfully.");
    } catch (err: any) {
      setStatus(err?.response?.data?.error || err?.message || "Upload failed.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <p className="settings-kicker">Admin Settings</p>
          <h1>Employee Dashboard Images</h1>
          <span>Upload workflow card images. Files are uploaded to ImageKit and shown on the employee dashboard.</span>
        </div>
        <div className="settings-metric">
          <small>Configured Images</small>
          <strong>{imageCount}/4</strong>
        </div>
      </div>

      <div className="settings-toolbar">
        <button type="button" onClick={loadSettings} className="settings-secondary-btn">
          <MdRefresh size={18} />
          Refresh
        </button>
        {status && <span className="settings-status">{status}</span>}
      </div>

      <div className="workflow-settings-grid">
        {items.map((item) => {
          const preview = draftImages[item.key] || item.image_url || fallbackImages[item.key];
          return (
            <article className="workflow-setting-card" key={item.key}>
              <div className="workflow-setting-preview">
                {preview ? <img src={preview} alt={item.title} /> : <MdImage size={42} />}
              </div>
              <div className="workflow-setting-body">
                <div>
                  <small>Workflow Card</small>
                  <h2>{item.title}</h2>
                  <p>{item.image_url ? "ImageKit image active" : "Using local fallback image"}</p>
                </div>
                <label className="workflow-upload-control">
                  <MdCloudUpload size={20} />
                  <span>Choose Image</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleFileChange(item.key, e.target.files?.[0])}
                  />
                </label>
                <button
                  type="button"
                  className="settings-save-btn"
                  onClick={() => saveImage(item)}
                  disabled={savingKey === item.key || !draftImages[item.key]}
                >
                  <MdSave size={18} />
                  {savingKey === item.key ? "Uploading..." : "Save Image"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;
