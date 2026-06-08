import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";
import { getImageUrl } from "../utils/image";
import {
  MdAddBox,
  MdAutoGraph,
  MdFactory,
  MdHealthAndSafety,
  MdInventory,
  MdInventory2,
  MdOutlineAccessTime,
  MdOutlineArrowForward,
  MdOutlineWarningAmber,
  MdPointOfSale,
  MdRefresh,
  MdSearch,
  MdSettingsSuggest,
} from "react-icons/md";

const dayKey = (value: string | number) => new Date(value).toISOString().slice(0, 10);
const formatNumber = (value: number) => new Intl.NumberFormat("en-IN").format(value || 0);

const workflowImages = {
  production: "/assets/workflow/rattle-production.png",
  material: "/assets/workflow/rattle-material.png",
  packing: "/assets/workflow/rattle-packing.png",
  dispatch: "/assets/workflow/rattle-dispatch.png",
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Admin";
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [data, setData] = useState<any>({
    products: [], combos: [], rawEntries: [], productProductions: [],
    packetProductions: [], packetCombos: [], rawStock: [], productionStock: [],
    packetStock: [], packetSales: [],
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [products, combos, rawEntries, productProductions, packetProductions,
        packetCombos, rawStock, productionStock, packetStock, packetSales] = await Promise.all([
        (window as any).electronAPI.getProducts?.(),
        (window as any).electronAPI.getCombinations?.(),
        (window as any).electronAPI.getRawEntries?.(),
        (window as any).electronAPI.getProductionEntries?.(),
        (window as any).electronAPI.getPacketProductions?.(),
        (window as any).electronAPI.getPacketCombinations?.(),
        (window as any).electronAPI.getRawStock?.(),
        (window as any).electronAPI.getProductionStock?.(),
        (window as any).electronAPI.getPacketStock?.(),
        (window as any).electronAPI.getPacketSales?.(),
      ]);
      setData({
        products: products || [], combos: combos || [], rawEntries: rawEntries || [],
        productProductions: productProductions || [], packetProductions: packetProductions || [],
        packetCombos: packetCombos || [], rawStock: rawStock || [],
        productionStock: productionStock || [], packetStock: packetStock || [],
        packetSales: packetSales || [],
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const insights = useMemo(() => {
    const sum = (list: any[], field: string) => list.reduce((total, item) => total + Number(item[field] || 0), 0);
    const rawTotal = sum(data.rawStock, "total_qty");
    const productTotal = sum(data.productionStock, "total_qty");
    const packetTotal = sum(data.packetStock, "total_qty");
    const lowRaw = data.rawStock.filter((item: any) => item.total_qty <= 10);
    const lowProducts = data.productionStock.filter((item: any) => item.total_qty <= 10);
    const lowPackets = data.packetStock.filter((item: any) => item.total_qty <= 10);
    const totalProductProduced = sum(data.productProductions, "qty");
    const totalPacketsSold = sum(data.packetSales, "qty");
    const addedRawEntries = data.rawEntries.filter((item: any) => Number(item.quantity) > 0);
    const usedRawEntries = data.rawEntries.filter((item: any) => Number(item.quantity) < 0);

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      };
    });

    const trend = days.map((day) => ({
      ...day,
      product: data.productProductions.filter((p: any) => dayKey(p.date) === day.key).reduce((s: number, p: any) => s + Number(p.qty || 0), 0),
      packet: data.packetProductions.filter((p: any) => dayKey(p.date) === day.key).reduce((s: number, p: any) => s + Number(p.qty || 0), 0),
      sold: data.packetSales.filter((p: any) => dayKey(p.date) === day.key).reduce((s: number, p: any) => s + Number(p.qty || 0), 0),
    }));
    const maxTrend = Math.max(1, ...trend.flatMap((item) => [item.product, item.packet, item.sold]));

    const activities = [
      ...data.productProductions.map((item: any) => ({ type: "Production batch", detail: item.combo_name, qty: item.qty, by: item.entry_by, date: item.date, tone: "green", image: item.sample_image })),
      ...data.packetProductions.map((item: any) => ({ type: "Packet production", detail: `${item.packet_code} / ${item.group_name}`, qty: item.qty, by: item.entry_by, date: item.date, tone: "blue" })),
      ...data.rawEntries.map((item: any) => ({ type: item.quantity < 0 ? "Material used" : "Material received", detail: `${item.part_code} ${item.color_code || ""}`, qty: item.quantity, by: item.entry_by, date: item.entry_date, tone: item.quantity < 0 ? "red" : "violet", image: item.color_image })),
      ...data.packetSales.map((item: any) => ({ type: "Packet sale", detail: item.packet_code, qty: -item.qty, by: item.entry_by, date: item.date, tone: "amber" })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);

    const topGroups = [...data.productionStock].sort((a: any, b: any) => b.total_qty - a.total_qty).slice(0, 5);
    return { rawTotal, productTotal, packetTotal, lowRaw, lowProducts, lowPackets, totalProductProduced, totalPacketsSold, addedRawEntries, usedRawEntries, trend, maxTrend, activities, topGroups };
  }, [data]);

  if (loading) {
    return <div className="admin-dashboard-loading"><MdRefresh className="spinner" size={34} /><p>Preparing admin command room...</p></div>;
  }

  const healthItems = [
    { label: "Materials", total: insights.rawTotal, low: insights.lowRaw.length, tone: "blue" },
    { label: "Products", total: insights.productTotal, low: insights.lowProducts.length, tone: "green" },
    { label: "Packets", total: insights.packetTotal, low: insights.lowPackets.length, tone: "orange" },
  ];

  const actionQueue = [
    { icon: "!", title: "Packet production audit", detail: `${data.packetProductions.length} packet productions need review`, level: "High" },
    { icon: "R", title: "Raw material reconciliation", detail: `${insights.usedRawEntries.length} used entries recorded`, level: "Med" },
    { icon: "OK", title: "Product group check", detail: `${data.combos.length} combinations configured`, level: "Low" },
    { icon: "S", title: "Packet sale verification", detail: `${formatNumber(insights.totalPacketsSold)} packets sold in cycle`, level: "Med" },
  ];

  return (
    <div className="admin-command-dashboard">
      <header className="command-top">
        <div>
          <h1>Admin Command Room</h1>
          <p>A visual management dashboard for rattle toy inventory, production and dispatch.</p>
        </div>
        <div className="command-search"><MdSearch /> Search by product, packet, part...</div>
        <button className="command-sync" onClick={loadDashboardData}>
          <MdRefresh /> Sync Now
        </button>
      </header>

      <section className="command-hero-grid">
        <article className="toy-hero-card">
          <div className="toy-hero-copy">
            <h2>Rattle toy operations, beautifully visible</h2>
            <p>From colorful parts to finished packets, keep every stock movement clear for management decisions.</p>
            <div className="hero-mini-stats">
              <div><span>Today output</span><strong>{formatNumber(insights.totalProductProduced)}</strong></div>
              <div><span>Packets ready</span><strong>{formatNumber(insights.packetTotal)}</strong></div>
            </div>
          </div>
          <img className="toy-hero-img" src={workflowImages.production} alt="Rattle production workflow" />
        </article>

        <div className="visual-kpi-grid">
          <article className="visual-kpi blue">
            <div><h3>Product Designs</h3><span>Active references</span><strong>{formatNumber(data.products.length)}</strong></div>
            <img src={workflowImages.production} alt="Product designs" />
          </article>
          <article className="visual-kpi green">
            <div><h3>Packet Stock</h3><span>Available packets</span><strong>{formatNumber(insights.packetTotal)}</strong></div>
            <img src={workflowImages.packing} alt="Packet stock" />
          </article>
          <article className="visual-kpi pink">
            <div><h3>Sales Dispatch</h3><span>Packets sold</span><strong>{formatNumber(insights.totalPacketsSold)}</strong></div>
            <img src={workflowImages.dispatch} alt="Dispatch" />
          </article>
          <article className="visual-kpi purple">
            <div><h3>Material Entries</h3><span>Stock records</span><strong>{formatNumber(data.rawEntries.length)}</strong></div>
            <img src={workflowImages.material} alt="Material entries" />
          </article>
        </div>
      </section>

      <section className="command-content-grid">
        <div className="command-left-stack">
          <article className="command-panel movement-panel">
            <div className="command-panel-head">
              <h2>Stock Movement Intelligence</h2>
              <span>Last 7 days</span>
            </div>
            <div className="movement-chart">
              {insights.trend.map((day) => (
                <div className="movement-day" key={day.key}>
                  <div className="movement-bars">
                    <div className="movement-bar product" style={{ height: `${Math.max(8, (day.product / insights.maxTrend) * 100)}%` }} title={`Products ${day.product}`} />
                    <div className="movement-bar packet" style={{ height: `${Math.max(8, (day.packet / insights.maxTrend) * 100)}%` }} title={`Packets ${day.packet}`} />
                    <div className="movement-bar sale" style={{ height: `${Math.max(8, (day.sold / insights.maxTrend) * 100)}%` }} title={`Sales ${day.sold}`} />
                  </div>
                  <small>{day.label}</small>
                </div>
              ))}
            </div>
          </article>

          <div className="command-bottom-grid">
            <article className="command-panel health-score-panel">
              <div className="command-panel-head compact">
                <h2>Health Score</h2>
                <button onClick={() => navigate("/admin/stock-overview")}>Details</button>
              </div>
              {healthItems.map((item) => {
                const level = item.low === 0 ? 92 : Math.max(28, 80 - item.low * 7);
                return (
                  <div className="health-score-row" key={item.label}>
                    <div><span>{item.label}</span><b>{level}%</b></div>
                    <div className="health-score-track"><i className={item.tone} style={{ width: `${level}%` }} /></div>
                  </div>
                );
              })}
            </article>

            <article className="command-panel recent-movement-panel">
              <div className="command-panel-head compact">
                <h2>Recent Movement</h2>
                <button onClick={() => navigate("/admin/raw-list")}>Ledger</button>
              </div>
              <div className="recent-events">
                {insights.activities.slice(0, 2).map((item: any, index: number) => (
                  <div className="recent-event" key={`${item.type}-${index}`}>
                    <span className={item.tone} />
                    <div><b>{item.type}</b><small>{item.detail}</small></div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        <article className="command-panel action-queue-panel">
          <div className="command-panel-head">
            <h2>Admin Action Queue</h2>
            <span>Open all</span>
          </div>
          <div className="action-list">
            {actionQueue.map((item) => (
              <div className="action-row" key={item.title}>
                <i>{item.icon}</i>
                <div><b>{item.title}</b><small>{item.detail}</small></div>
                <span className={`priority ${item.level.toLowerCase()}`}>{item.level}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="command-activity-panel">
        <div className="command-panel-head">
          <h2><MdOutlineAccessTime /> Live Activity Feed</h2>
          <span>Updated {lastUpdated?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="activity-feed-grid">
          {insights.activities.slice(0, 4).map((item: any, index: number) => (
            <div className="feed-card" key={`${item.type}-${index}`}>
              <div className={`feed-icon ${item.tone}`}>
                {item.image ? <img src={getImageUrl(item.image)} onClick={() => setPreviewModalImg(getImageUrl(item.image))} /> : item.type.includes("sale") ? <MdPointOfSale /> : <MdFactory />}
              </div>
              <div><b>{item.type}</b><small>{item.detail}</small></div>
              <strong className={item.qty < 0 ? "negative" : "positive"}>{item.qty > 0 ? "+" : ""}{item.qty}</strong>
            </div>
          ))}
        </div>
      </section>

      {previewModalImg && (
        <div className="image-preview-modal-overlay" onClick={() => setPreviewModalImg(null)}>
          <div className="image-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview-modal" onClick={() => setPreviewModalImg(null)}>x</button>
            <img src={previewModalImg} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
