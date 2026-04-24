import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis, YAxis,
  ZAxis
} from "recharts";

// ─── API LAYER ────────────────────────────────────────────────────
const BASE = "http://localhost:3001/api";

async function apiCall(method, path, body = null) {
  try {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (e) {
    throw new Error(`API call failed: ${e.message}`);
  }
}

// ─── LOCAL STORAGE ────────────────────────────────────────────────
const Store = {
  get: (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// ─── SEED DATA ────────────────────────────────────────────────────
const SEEDS = [
  { id:"s1", name:"Apple Inc.",  category:"Stocks", sub:"AAPL", qty:50,  buyPrice:150,   curVal:8750  },
  { id:"s2", name:"Tesla",       category:"Stocks", sub:"TSLA", qty:25,  buyPrice:280,   curVal:6125  },
  { id:"s3", name:"Bitcoin",     category:"Crypto", sub:"BTC",  qty:2,   buyPrice:30000, curVal:84000 },
  { id:"s4", name:"S&P 500 ETF", category:"Stocks", sub:"SPY",  qty:100, buyPrice:430,   curVal:44000 },
  { id:"s5", name:"Gold",        category:"Savings",sub:"GOLD", qty:10,  buyPrice:1900,  curVal:19500 },
  { id:"s6", name:"Microsoft",   category:"Stocks", sub:"MSFT", qty:40,  buyPrice:280,   curVal:20800 },
];

// ─── CONTEXTS ─────────────────────────────────────────────────────
const AuthCtx = createContext(null);
const PortCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);
const usePort = () => useContext(PortCtx);

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const PALETTE   = ["#6366f1","#f59e0b","#10b981","#3b82f6","#ec4899","#14b8a6"];
const CAT_COLOR = { Stocks:"#6366f1", Crypto:"#f59e0b", Savings:"#10b981" };
const S = {
  card:    { background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"22px 24px", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" },
  label:   { fontSize:12, color:"#94a3b8", marginBottom:6, display:"block", fontWeight:500 },
  input:   { width:"100%", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:9, color:"#1e293b", padding:"11px 14px", fontSize:14, boxSizing:"border-box", outline:"none", fontFamily:"inherit" },
  btn:     { background:"#6366f1", border:"none", borderRadius:9, color:"#fff", padding:"11px 22px", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"inherit" },
  btnGhost:{ background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:9, color:"#64748b", padding:"10px 18px", cursor:"pointer", fontSize:13, fontWeight:500, fontFamily:"inherit" },
};

// ─── ICONS ────────────────────────────────────────────────────────
const Ic = {
  Grid:  ()=><svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M3 11h8V3H3m0 18h8v-8H3m10 8h8v-8h-8m0-10v8h8V3"/></svg>,
  Brief: ()=><svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-7 3a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3m6 13H6v-.9C6 15.9 9.6 14 12 14s6 1.9 6 4.1z"/></svg>,
  Chart: ()=><svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg>,
  Bot:   ()=><svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H4a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7 14v2h2v-2H7m8 0v2h2v-2h-2m-8 6h10v2H7v-2z"/></svg>,
  Gear:  ()=><svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.36.07-.72.07-1.08s-.03-.73-.07-1.08l2.32-1.81c.21-.16.27-.46.13-.7l-2.2-3.81c-.13-.24-.42-.32-.65-.24l-2.74 1.1a8.3 8.3 0 0 0-1.86-1.08l-.41-2.91A.535.535 0 0 0 13.5 3h-3c-.28 0-.5.2-.53.47l-.41 2.91a8.3 8.3 0 0 0-1.86 1.08L5 6.37c-.24-.09-.52 0-.65.24l-2.2 3.81c-.14.24-.08.54.13.7l2.32 1.81c-.04.35-.07.72-.07 1.07s.03.73.07 1.08L2.28 16.9c-.21.16-.27.46-.13.7l2.2 3.81c.13.24.42.32.65.24l2.74-1.1c.58.42 1.2.75 1.86 1.08l.41 2.91c.03.27.25.47.53.47h3c.28 0 .5-.2.53-.47l.41-2.91a8.3 8.3 0 0 0 1.86-1.08l2.74 1.1c.24.09.52 0 .65-.24l2.2-3.81c.14-.24.08-.54-.13-.7z"/></svg>,
  Plus:  ()=><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
  Edit:  ()=><svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>,
  Trash: ()=><svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
  Up:    ()=><svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>,
  Down:  ()=><svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"/></svg>,
  Send:  ()=><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>,
  Bell:  ()=><svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>,
  Search:()=><svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>,
  X:     ()=><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>,
  Network:()=><svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M17 12a5 5 0 0 0-5-5 5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5m2.03.5H21v-1h-1.97A7.5 7.5 0 0 0 12.5 4.97V3h-1v1.97A7.5 7.5 0 0 0 4.97 11.5H3v1h1.97A7.5 7.5 0 0 0 11.5 19.03V21h1v-1.97A7.5 7.5 0 0 0 19.03 12.5z"/></svg>,
};

// ─── MODAL ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.35)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)" }}>
      <div style={{ background:"#fff",borderRadius:18,padding:32,width:490,maxWidth:"95vw",boxShadow:"0 24px 60px rgba(0,0,0,0.12)",border:"1px solid #e2e8f0" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
          <h3 style={{ color:"#0f172a",fontSize:17,fontWeight:700,margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"#f1f5f9",border:"none",borderRadius:8,color:"#64748b",cursor:"pointer",padding:"6px 8px",lineHeight:0 }}><Ic.X/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── ASSET FORM ───────────────────────────────────────────────────
function AssetForm({ init, onSave, onClose }) {
  const [f, setF] = useState(init || { name:"", category:"Stocks", sub:"", qty:"", buyPrice:"", curVal:"" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        <div style={{ gridColumn:"1/-1" }}>
          <label style={S.label}>Asset Name</label>
          <input style={S.input} value={f.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Apple Inc." />
        </div>
        <div>
          <label style={S.label}>Category</label>
          <select style={S.input} value={f.category} onChange={e=>set("category",e.target.value)}>
            {["Stocks","Crypto","Savings"].map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Ticker Symbol</label>
          <input style={S.input} value={f.sub} onChange={e=>set("sub",e.target.value)} placeholder="AAPL, MSFT, BTC…" />
        </div>
        <div>
          <label style={S.label}>Quantity</label>
          <input style={S.input} type="number" value={f.qty} onChange={e=>set("qty",e.target.value)} placeholder="0" />
        </div>
        <div>
          <label style={S.label}>Purchase Price ($)</label>
          <input style={S.input} type="number" value={f.buyPrice} onChange={e=>set("buyPrice",e.target.value)} placeholder="0.00" />
        </div>
        <div style={{ gridColumn:"1/-1" }}>
          <label style={S.label}>Current Value ($)</label>
          <input style={S.input} type="number" value={f.curVal} onChange={e=>set("curVal",e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <div style={{ display:"flex",gap:12,marginTop:24 }}>
        <button onClick={onClose} style={S.btnGhost}>Cancel</button>
        <button onClick={()=>{ if(!f.name||!f.qty||!f.curVal) return; onSave({...f,id:init?.id||Date.now().toString(),qty:+f.qty,buyPrice:+f.buyPrice,curVal:+f.curVal}); }} style={{...S.btn,flex:1}}>
          {init?"Save Changes":"Add Asset"}
        </button>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard",  label:"Dashboard",     icon:Ic.Grid    },
  { id:"portfolio",  label:"Portfolio",     icon:Ic.Brief   },
  { id:"analytics",  label:"Analytics",     icon:Ic.Chart   },
  { id:"graph",      label:"Graph Insights",icon:Ic.Network },
  { id:"ai",         label:"AI Assistant",  icon:Ic.Bot     },
  { id:"settings",   label:"Settings",      icon:Ic.Gear    },
];

function Sidebar({ active, setPage }) {
  const { user } = useAuth();
  return (
    <div style={{ width:224,minHeight:"100vh",background:"#fff",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",flexShrink:0 }}>
      <div style={{ padding:"22px 20px 18px",borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <span style={{ color:"#fff",fontWeight:800,fontSize:16 }}>A</span>
          </div>
          <div>
            <div style={{ color:"#0f172a",fontWeight:800,fontSize:15 }}>AssetSynx AI</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1,padding:"10px 10px" }}>
        {NAV.map(({id,label,icon:Ico})=>{
          const on=active===id;
          return (
            <button key={id} onClick={()=>setPage(id)} style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 13px",borderRadius:10,border:"none",cursor:"pointer",marginBottom:2,fontSize:13.5,fontWeight:on?600:400,fontFamily:"inherit",background:on?"#eef2ff":"transparent",color:on?"#6366f1":"#64748b",textAlign:"left" }}>
              <Ico/> {label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:"14px 16px 20px",borderTop:"1px solid #f1f5f9" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0 }}>{user.avatar}</div>
          <div>
            <div style={{ color:"#1e293b",fontSize:13,fontWeight:600 }}>{user.name}</div>
            <div style={{ color:"#94a3b8",fontSize:11 }}>Investor</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────
function Topbar({ backendStatus }) {
  return (
    <div style={{ height:56,background:"#fff",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",padding:"0 24px",gap:14,position:"sticky",top:0,zIndex:100 }}>
      <div style={{ flex:1 }}/>
      <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12 }}>
        <div style={{ width:8,height:8,borderRadius:"50%",background:backendStatus==="online"?"#10b981":"#ef4444" }}/>
        <span style={{ color:"#94a3b8" }}>{backendStatus==="online"?"Backend connected":"Backend offline — using local ML"}</span>
      </div>
      <div style={{ width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff" }}>User</div>
    </div>
  );
}

// ─── ASSET CARD ───────────────────────────────────────────────────
function AssetCard({ asset, onEdit, onDelete }) {
  const cost=asset.buyPrice*asset.qty, gain=asset.curVal-cost;
  const pct=cost>0?((gain/cost)*100).toFixed(2):0, pos=gain>=0;
  const col=CAT_COLOR[asset.category]||"#6366f1";
  return (
    <div style={{ ...S.card,position:"relative" }}>
      <div style={{ position:"absolute",top:14,right:14,display:"flex",gap:6 }}>
        <button onClick={()=>onEdit(asset)} style={{ background:"#eef2ff",border:"none",borderRadius:7,color:"#6366f1",cursor:"pointer",padding:"5px 8px",lineHeight:0 }}><Ic.Edit/></button>
        <button onClick={()=>onDelete(asset.id)} style={{ background:"#fff1f2",border:"none",borderRadius:7,color:"#ef4444",cursor:"pointer",padding:"5px 8px",lineHeight:0 }}><Ic.Trash/></button>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
        <div style={{ width:42,height:42,borderRadius:12,background:`${col}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>
          {asset.category==="Crypto"?"₿":asset.category==="Stocks"?"📊":"🏦"}
        </div>
        <div>
          <div style={{ color:"#0f172a",fontWeight:700,fontSize:15 }}>{asset.name}</div>
          <span style={{ background:`${col}14`,color:col,fontSize:11,padding:"2px 9px",borderRadius:20,fontWeight:600 }}>{asset.sub||asset.category}</span>
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14 }}>
        {[["Quantity",asset.qty],["Buy Price",`$${asset.buyPrice.toLocaleString()}`]].map(([l,v])=>(
          <div key={l} style={{ background:"#f8fafc",borderRadius:9,padding:"10px 12px" }}>
            <div style={{ color:"#94a3b8",fontSize:11,marginBottom:3 }}>{l}</div>
            <div style={{ color:"#1e293b",fontSize:14,fontWeight:600 }}>{v}</div>
          </div>
        ))}
        <div style={{ background:"#f8fafc",borderRadius:9,padding:"10px 12px",gridColumn:"1/-1" }}>
          <div style={{ color:"#94a3b8",fontSize:11,marginBottom:3 }}>Current Value</div>
          <div style={{ color:"#0f172a",fontSize:17,fontWeight:700 }}>${asset.curVal.toLocaleString()}</div>
        </div>
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:"1px solid #f1f5f9" }}>
        <span style={{ color:"#94a3b8",fontSize:12 }}>Total Change</span>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:pos?"#10b981":"#ef4444",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end" }}>
            {pos?<Ic.Up/>:<Ic.Down/>} {pos?"+":""}{pct}%
          </div>
          <div style={{ color:pos?"#10b981":"#ef4444",fontSize:11 }}>{pos?"+":""}${gain.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

// ─── GRAPH VISUALISER (SVG-based) ────────────────────────────────
function GraphVisualiser({ nodes, edges }) {
  if (!nodes || nodes.length === 0) return (
    <div style={{ textAlign:"center",color:"#94a3b8",padding:40 }}>No graph data available</div>
  );

  const W=520, H=320, cx=W/2, cy=H/2, r=110;

  // Position nodes in a circle
  const positioned = nodes.map((n,i) => {
    const angle = (2*Math.PI*i/nodes.length) - Math.PI/2;
    return { ...n, x: cx + r*Math.cos(angle), y: cy + r*Math.sin(angle) };
  });

  const nodeMap = {};
  positioned.forEach(n => { nodeMap[n.id]=n; });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily:"inherit" }}>
      {/* Edges */}
      {edges.map((e,i)=>{
        const a=nodeMap[e.source], b=nodeMap[e.target];
        if(!a||!b) return null;
        const abs=Math.abs(e.correlation);
        const color= abs>0.7?"#ef4444": abs>0.5?"#f59e0b":"#94a3b8";
        return (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={color} strokeWidth={abs*4} strokeOpacity={0.6}/>
        );
      })}
      {/* Nodes */}
      {positioned.map(n=>{
        const col=CAT_COLOR[n.sector]||"#6366f1";
        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={22} fill={`${col}22`} stroke={col} strokeWidth={2}/>
            <text x={n.x} y={n.y+1} textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600} fill={col}>{n.label?.slice(0,4)}</text>
            <text x={n.x} y={n.y+32} textAnchor="middle" fontSize={9} fill="#64748b">{n.sector}</text>
          </g>
        );
      })}
      {/* Legend */}
      {[["#ef4444","High (>0.7)"],["#f59e0b","Medium (0.5-0.7)"],["#94a3b8","Low (<0.5)"]].map(([c,l],i)=>(
        <g key={i} transform={`translate(12,${H-60+i*18})`}>
          <line x1={0} y1={5} x2={20} y2={5} stroke={c} strokeWidth={2.5}/>
          <text x={26} y={9} fontSize={9} fill="#64748b">{l}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── GRAPH INSIGHTS PAGE ─────────────────────────────────────────
function GraphPage() {
  const { assets }  = usePort();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiCall("POST","/analyse",{ portfolio:assets });
      setData(result);
    } catch(e) {
      console.error(e);
    } finally { setLoading(false); }
  }, [assets]);

  useEffect(() => { if(assets.length>0) runAnalysis(); }, []);

  return (
    <div style={{ padding:"28px 28px 48px",background:"#f8fafc",minHeight:"100%" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
        <div>
          <h1 style={{ color:"#0f172a",fontSize:26,fontWeight:800,margin:0 }}>Graph Insights</h1>
          <p style={{ color:"#94a3b8",margin:"5px 0 0",fontSize:14 }}>Asset correlation network + concentration analysis</p>
        </div>
        <button onClick={runAnalysis} style={{ ...S.btn,opacity:loading?0.7:1 }} disabled={loading}>
          {loading?"Analysing…":"Run Analysis"}
        </button>
      </div>

      {!data && !loading && (
        <div style={{ ...S.card,textAlign:"center",padding:60,color:"#94a3b8" }}>
          Click "Run Analysis" to build your correlation graph
        </div>
      )}

      {loading && (
        <div style={{ ...S.card,textAlign:"center",padding:60,color:"#6366f1" }}>
          Building graph… calculating correlations…
        </div>
      )}

      {data && (
        <>
          {/* Metric row */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:22 }}>
            {[
              { label:"Risk Level",      val:data.risk?.level,            sub:`Score ${data.risk?.score}/100`,   col:data.risk?.color||"#6366f1" },
              { label:"Concentration",   val:data.concentration?.label,   sub:`${data.concentration?.score}/100`,col:data.concentration?.score>60?"#ef4444":"#10b981" },
              { label:"Diversification", val:data.diversification?.label, sub:`${data.diversification?.score}/100`,col:"#6366f1" },
              { label:"Clusters Found",  val:data.clusters?.length,       sub:"correlated groups",               col:"#f59e0b" },
            ].map(m=>(
              <div key={m.label} style={S.card}>
                <div style={{ fontSize:12,color:"#94a3b8",marginBottom:8,fontWeight:500 }}>{m.label}</div>
                <div style={{ color:m.col,fontSize:22,fontWeight:800 }}>{m.val}</div>
                <div style={{ color:"#94a3b8",fontSize:12,marginTop:5 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Graph + Clusters */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:22 }}>
            <div style={S.card}>
              <div style={{ color:"#0f172a",fontSize:14,fontWeight:700,marginBottom:16 }}>Correlation Network</div>
              <GraphVisualiser nodes={data.graph?.nodes} edges={data.graph?.edges}/>
              <div style={{ marginTop:12,fontSize:12,color:"#94a3b8" }}>
                Avg correlation: {data.concentration?.avgCorrelation} · {data.graph?.edges?.length} edges
              </div>
            </div>
            <div style={S.card}>
              <div style={{ color:"#0f172a",fontSize:14,fontWeight:700,marginBottom:16 }}>Detected Clusters</div>
              {data.clusters?.map((c,i)=>(
                <div key={i} style={{ background:c.risk==="High Concentration"?"#fff1f2":"#f0fdf4",border:`1px solid ${c.risk==="High Concentration"?"#fecdd3":"#bbf7d0"}`,borderRadius:10,padding:"12px 16px",marginBottom:10 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                    <span style={{ fontWeight:600,fontSize:13,color:"#1e293b" }}>Cluster {i+1} — {c.assets.length} assets</span>
                    <span style={{ fontSize:11,color:c.risk==="High Concentration"?"#ef4444":"#10b981",fontWeight:600 }}>{c.risk}</span>
                  </div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {c.assets.map(a=>(
                      <span key={a} style={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:6,padding:"3px 8px",fontSize:12,color:"#1e293b" }}>{a}</span>
                    ))}
                  </div>
                  {c.risk==="High Concentration"&&<div style={{ marginTop:8,fontSize:12,color:"#ef4444" }}>These assets are highly correlated — a downturn in one likely drags the others.</div>}
                </div>
              ))}
            </div>
          </div>

          {/* VaR Panel */}
          {data.var && (
            <div style={{ ...S.card,marginBottom:22 }}>
              <div style={{ color:"#0f172a",fontSize:14,fontWeight:700,marginBottom:16 }}>Value at Risk (95% Confidence)</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16 }}>
                <div style={{ background:"#f8fafc",borderRadius:9,padding:"16px" }}>
                  <div style={{ color:"#94a3b8",fontSize:12,marginBottom:6 }}>Daily VaR</div>
                  <div style={{ color:"#ef4444",fontSize:20,fontWeight:700 }}>${data.var.daily?.toLocaleString()}</div>
                  <div style={{ color:"#94a3b8",fontSize:11,marginTop:4 }}>Max expected daily loss</div>
                </div>
                <div style={{ background:"#f8fafc",borderRadius:9,padding:"16px" }}>
                  <div style={{ color:"#94a3b8",fontSize:12,marginBottom:6 }}>Monthly VaR</div>
                  <div style={{ color:"#f59e0b",fontSize:20,fontWeight:700 }}>${data.var.monthly?.toLocaleString()}</div>
                  <div style={{ color:"#94a3b8",fontSize:11,marginTop:4 }}>Over 21 trading days</div>
                </div>
                <div style={{ background:"#f8fafc",borderRadius:9,padding:"16px" }}>
                  <div style={{ color:"#94a3b8",fontSize:12,marginBottom:6 }}>Interpretation</div>
                  <div style={{ color:"#1e293b",fontSize:13,fontWeight:500,marginTop:4 }}>{data.var.meaning}</div>
                </div>
              </div>
            </div>
          )}

          {/* Edge detail table */}
          <div style={S.card}>
            <div style={{ color:"#0f172a",fontSize:14,fontWeight:700,marginBottom:16 }}>Pairwise Correlation Table</div>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"2px solid #f1f5f9" }}>
                  {["Asset A","Asset B","Correlation","Strength","Basis"].map(h=>(
                    <th key={h} style={{ color:"#94a3b8",fontSize:12,fontWeight:600,padding:"8px 12px",textAlign:"left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.graph?.edges?.map((e,i)=>{
                  const a=data.graph.nodes.find(n=>n.id===e.source);
                  const b=data.graph.nodes.find(n=>n.id===e.target);
                  const col=Math.abs(e.correlation)>0.7?"#ef4444":Math.abs(e.correlation)>0.5?"#f59e0b":"#10b981";
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid #f8fafc" }}>
                      <td style={{ padding:"11px 12px",color:"#1e293b",fontSize:13,fontWeight:500 }}>{a?.label}</td>
                      <td style={{ padding:"11px 12px",color:"#1e293b",fontSize:13,fontWeight:500 }}>{b?.label}</td>
                      <td style={{ padding:"11px 12px",color:col,fontSize:13,fontWeight:700 }}>{e.correlation}</td>
                      <td style={{ padding:"11px 12px" }}><span style={{ background:`${col}14`,color:col,fontSize:11,padding:"2px 9px",borderRadius:20,fontWeight:600 }}>{e.strength}</span></td>
                      <td style={{ padding:"11px 12px",color:"#64748b",fontSize:12 }}>{e.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ANALYTICS PAGE (upgraded with MPT) ──────────────────────────
function Analytics() {
  const { assets } = usePort();
  const [mpt,     setMpt]     = useState(null);
  const [frontier,setFrontier]= useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if(assets.length===0) return;
    setLoading(true);
    apiCall("POST","/analyse",{ portfolio:assets })
      .then(d=>{ setMpt(d.mpt); setFrontier(d.frontier||[]); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[assets]);

  const tot  = assets.reduce((s,a)=>s+a.curVal,0);
  const byC  = {};
  assets.forEach(a=>{ byC[a.category]=(byC[a.category]||0)+a.curVal; });
  const catRows = Object.entries(byC).map(([cat,val],i)=>({ cat,val,pct:Math.round((val/Math.max(1,tot))*100),col:PALETTE[i%PALETTE.length] }));

  return (
    <div style={{ padding:"28px 28px 48px",background:"#f8fafc",minHeight:"100%" }}>
      <h1 style={{ color:"#0f172a",fontSize:26,fontWeight:800,margin:"0 0 6px" }}>Analytics</h1>
      <p style={{ color:"#94a3b8",margin:"0 0 26px",fontSize:14 }}>MPT optimisation + category exposure</p>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:22 }}>
        <div style={S.card}>
          <div style={{ color:"#0f172a",fontSize:14,fontWeight:700,marginBottom:18 }}>Category Exposure</div>
          {catRows.map(c=>(
            <div key={c.cat} style={{ marginBottom:16 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                <span style={{ color:"#1e293b",fontSize:13,fontWeight:500 }}>{c.cat}</span>
                <span style={{ color:c.col,fontSize:13,fontWeight:700 }}>{c.pct}%</span>
              </div>
              <div style={{ height:8,background:"#f1f5f9",borderRadius:4,overflow:"hidden" }}>
                <div style={{ height:"100%",width:`${c.pct}%`,background:c.col,borderRadius:4,transition:"width .5s" }}/>
              </div>
              <div style={{ color:"#94a3b8",fontSize:11,marginTop:3 }}>${c.val.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* MPT Panel */}
        <div style={S.card}>
          <div style={{ color:"#0f172a",fontSize:14,fontWeight:700,marginBottom:16 }}>MPT Allocation Optimisation</div>
          {loading && <div style={{ color:"#6366f1",fontSize:13 }}>Calculating optimal weights…</div>}
          {mpt && !mpt.error && (
            <>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
                {[
                  ["Expected Return",`${mpt.optimisedPortfolio?.expectedReturn}%`,"#10b981"],
                  ["Volatility",     `${mpt.optimisedPortfolio?.volatility}%`,   "#f59e0b"],
                  ["Sharpe Ratio",    mpt.optimisedPortfolio?.sharpe,             "#6366f1"],
                  ["Return Δ",       `+${mpt.improvement?.returnDelta}%`,         "#10b981"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ background:"#f8fafc",borderRadius:9,padding:"10px 12px" }}>
                    <div style={{ color:"#94a3b8",fontSize:11,marginBottom:3 }}>{l}</div>
                    <div style={{ color:c,fontSize:15,fontWeight:700 }}>{v}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={mpt.assets} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="name" tick={{ fill:"#94a3b8",fontSize:10 }} tickFormatter={v=>v.slice(0,6)}/>
                  <YAxis tick={{ fill:"#94a3b8",fontSize:10 }} unit="%"/>
                  <Tooltip contentStyle={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12 }}/>
                  <Legend wrapperStyle={{ fontSize:11,color:"#94a3b8" }}/>
                  <Bar dataKey="currentWeight"   fill="#6366f1" radius={[4,4,0,0]} name="Current %"/>
                  <Bar dataKey="suggestedWeight" fill="#10b981" radius={[4,4,0,0]} name="Suggested %"/>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
          {mpt?.error && <div style={{ color:"#94a3b8",fontSize:13 }}>{mpt.error}</div>}
        </div>
      </div>

      {/* Efficient Frontier */}
      {frontier.length > 0 && (
        <div style={{ ...S.card,marginBottom:22 }}>
          <div style={{ color:"#0f172a",fontSize:14,fontWeight:700,marginBottom:4 }}>Efficient Frontier</div>
          <div style={{ color:"#94a3b8",fontSize:12,marginBottom:16 }}>Each dot = a different allocation weighting. Top-left = best (high return, low risk)</div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="risk"   name="Risk %" unit="%" tick={{ fill:"#94a3b8",fontSize:11 }} label={{ value:"Risk (Volatility %)",position:"insideBottom",offset:-4,fill:"#94a3b8",fontSize:11 }}/>
              <YAxis dataKey="return" name="Return %" unit="%" tick={{ fill:"#94a3b8",fontSize:11 }}/>
              <ZAxis dataKey="sharpe" range={[40,200]}/>
              <Tooltip cursor={{ strokeDasharray:"3 3" }} contentStyle={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12 }}/>
              <Scatter data={frontier} fill="#6366f1" fillOpacity={0.7}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Asset detail table */}
      {mpt && !mpt.error && (
        <div style={S.card}>
          <div style={{ color:"#0f172a",fontSize:14,fontWeight:700,marginBottom:16 }}>Per-Asset MPT Detail</div>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"2px solid #f1f5f9" }}>
                {["Asset","Ticker","Current","Suggested","Change","Exp Return","Volatility","Sharpe"].map(h=>(
                  <th key={h} style={{ color:"#94a3b8",fontSize:11,fontWeight:600,padding:"8px 10px",textAlign:"left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mpt.assets?.map(a=>(
                <tr key={a.id} style={{ borderBottom:"1px solid #f8fafc" }}>
                  <td style={{ padding:"11px 10px",color:"#0f172a",fontSize:13,fontWeight:600 }}>{a.name}</td>
                  <td style={{ padding:"11px 10px",color:"#64748b",fontSize:12 }}>{a.ticker}</td>
                  <td style={{ padding:"11px 10px",color:"#1e293b",fontSize:13 }}>{a.currentWeight}%</td>
                  <td style={{ padding:"11px 10px",color:"#10b981",fontSize:13,fontWeight:600 }}>{a.suggestedWeight}%</td>
                  <td style={{ padding:"11px 10px",color:a.change>=0?"#10b981":"#ef4444",fontSize:13,fontWeight:600 }}>{a.change>=0?"+":""}{a.change}%</td>
                  <td style={{ padding:"11px 10px",color:"#1e293b",fontSize:12 }}>{a.metrics?.expectedReturn}%/day</td>
                  <td style={{ padding:"11px 10px",color:"#1e293b",fontSize:12 }}>{a.metrics?.volatility}%</td>
                  <td style={{ padding:"11px 10px",color:"#6366f1",fontSize:12,fontWeight:600 }}>{a.metrics?.sharpe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────
function Dashboard() {
  const { assets, addAsset } = usePort();
  const [showAdd,  setShowAdd]  = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const tot  = assets.reduce((s,a)=>s+a.curVal,0);
  const cost = assets.reduce((s,a)=>s+a.buyPrice*a.qty,0);
  const gain = tot-cost;
  const pct  = cost>0?((gain/cost)*100).toFixed(2):0;
  const pieData = assets.map(a=>({ name:a.name,value:a.curVal }));

  useEffect(()=>{
    if(assets.length===0) return;
    apiCall("POST","/analyse",{ portfolio:assets })
      .then(setAnalysis).catch(()=>{});
  },[assets]);

  const recs = analysis?.recommendations || [];
  const risk = analysis?.risk;

  return (
    <div style={{ padding:"28px 28px 48px",background:"#f8fafc",minHeight:"100%" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
        <div>
          <h1 style={{ color:"#0f172a",fontSize:26,fontWeight:800,margin:0 }}>Dashboard</h1>
          <p style={{ color:"#94a3b8",margin:"5px 0 0",fontSize:14 }}>Welcome back! Here's your portfolio overview.</p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{ ...S.btn,display:"flex",alignItems:"center",gap:7 }}>
          <Ic.Plus/> Add Asset
        </button>
      </div>

      {/* Hero */}
      <div style={{ background:"linear-gradient(120deg,#4f46e5,#7c3aed,#9333ea)",borderRadius:18,padding:"30px 34px",marginBottom:22,color:"#fff",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-60,right:-60,width:240,height:240,borderRadius:"50%",background:"rgba(255,255,255,0.06)" }}/>
        <div style={{ fontSize:13,opacity:.75,marginBottom:8,fontWeight:500 }}>Total Portfolio Value</div>
        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:6 }}>
          <span style={{ fontSize:38,fontWeight:800 }}>${tot.toLocaleString()}</span>
          <span style={{ background:gain>=0?"rgba(255,255,255,0.18)":"rgba(239,68,68,0.35)",padding:"4px 13px",borderRadius:20,fontSize:13,fontWeight:600 }}>
            {gain>=0?"↑":"↓"} {gain>=0?"+":""}{pct}%
          </span>
        </div>
        <div style={{ fontSize:13,opacity:.6 }}>{gain>=0?"+":""}${gain.toLocaleString()} total gain</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginTop:20 }}>
          {[
            ["⚡ Risk Level",    risk?.level||"—",              risk?.score ? `Score ${risk.score}/100` : ""],
            ["◎ Diversification",analysis?.diversification?.label||"—", analysis?.diversification?.score ? `${analysis.diversification.score}/100` : ""],
            ["⬡ Concentration", analysis?.concentration?.label||"—",   analysis?.concentration?.score ? `${analysis.concentration.score}/100` : ""],
          ].map(([l,v,s])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.14)",borderRadius:12,padding:"14px 18px" }}>
              <div style={{ fontSize:11,opacity:.7,marginBottom:4 }}>{l}</div>
              <div style={{ fontWeight:700,fontSize:16 }}>{v}</div>
              {s && <div style={{ fontSize:11,opacity:.65,marginTop:2 }}>{s}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:22 }}>
        {[
          { label:"Total Assets",   val:assets.length,   sub:`${Object.keys({}).length||"—"} sectors`,  col:"#6366f1" },
          { label:"Portfolio Gain", val:`$${Math.abs(gain).toLocaleString()}`, sub:`${gain>=0?"+":"-"}${Math.abs(pct)}% overall`, col:gain>=0?"#10b981":"#ef4444" },
          { label:"Daily VaR",      val:analysis?.var ? `$${analysis.var.daily}` : "—", sub:"95% confidence", col:"#f59e0b" },
        ].map(c=>(
          <div key={c.label} style={S.card}>
            <div style={{ fontSize:12,color:"#94a3b8",marginBottom:8,fontWeight:500 }}>{c.label}</div>
            <div style={{ color:"#0f172a",fontSize:22,fontWeight:800 }}>{c.val}</div>
            <div style={{ color:c.col,fontSize:12,marginTop:5,fontWeight:500 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:22 }}>
        <div style={S.card}>
          <div style={{ color:"#0f172a",fontSize:14,fontWeight:700,marginBottom:16 }}>Portfolio Allocation</div>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={78} dataKey="value" label={({name,percent})=>`${name.slice(0,6)}: ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {pieData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
              </Pie>
              <Tooltip formatter={v=>`$${v.toLocaleString()}`} contentStyle={{ background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={{ color:"#0f172a",fontSize:14,fontWeight:700,marginBottom:10 }}>Graph Snapshot</div>
          {analysis ? <GraphVisualiser nodes={analysis.graph?.nodes} edges={analysis.graph?.edges}/> : <div style={{ height:180,display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8",fontSize:13 }}>Run analysis to see graph</div>}
        </div>
      </div>

      {/* Asset grid */}
      <div style={{ marginBottom:22 }}>
        <div style={{ color:"#0f172a",fontSize:15,fontWeight:700,marginBottom:14 }}>Your Assets</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16 }}>
          {assets.slice(0,6).map(a=><AssetCard key={a.id} asset={a} onEdit={()=>{}} onDelete={()=>{}}/>)}
        </div>
      </div>

      {/* Recommendations */}
      <div style={S.card}>
        <div style={{ color:"#0f172a",fontSize:14,fontWeight:700,marginBottom:14 }}>Smart Recommendations</div>
        <div style={{ display:"grid",gap:10 }}>
          {recs.slice(0,4).map((r,i)=>{
            const col=r.priority==="high"?"#ef4444":r.priority==="medium"?"#f59e0b":"#10b981";
            const icon=r.icon==="warning"?"⚠️":r.icon==="success"?"✅":"💡";
            return (
              <div key={i} style={{ background:`${col}0a`,border:`1px solid ${col}28`,borderRadius:10,padding:"13px 16px",display:"flex",gap:12 }}>
                <span style={{ fontSize:18 }}>{icon}</span>
                <div>
                  <div style={{ color:"#1e293b",fontWeight:600,fontSize:14 }}>{r.title}</div>
                  <div style={{ color:"#64748b",fontSize:13,marginTop:3,lineHeight:1.5 }}>{r.detail}</div>
                  {r.source && <span style={{ fontSize:11,color:col,fontWeight:600,marginTop:4,display:"inline-block" }}>Source: {r.source}</span>}
                </div>
              </div>
            );
          })}
          {recs.length===0 && <div style={{ color:"#94a3b8",fontSize:13,textAlign:"center",padding:20 }}>Run analysis to get recommendations</div>}
        </div>
      </div>

      {showAdd&&<Modal title="Add New Asset" onClose={()=>setShowAdd(false)}>
        <AssetForm onSave={a=>{addAsset(a);setShowAdd(false);}} onClose={()=>setShowAdd(false)}/>
      </Modal>}
    </div>
  );
}

// ─── PORTFOLIO PAGE ───────────────────────────────────────────────
function Portfolio() {
  const { assets, addAsset, updateAsset, deleteAsset } = usePort();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter,  setFilter ] = useState("All");
  const filtered = filter==="All"?assets:assets.filter(a=>a.category===filter);
  return (
    <div style={{ padding:"28px 28px 48px",background:"#f8fafc",minHeight:"100%" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
        <div>
          <h1 style={{ color:"#0f172a",fontSize:26,fontWeight:800,margin:0 }}>Portfolio</h1>
          <p style={{ color:"#94a3b8",margin:"5px 0 0",fontSize:14 }}>Manage your assets</p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{ ...S.btn,display:"flex",alignItems:"center",gap:7 }}><Ic.Plus/> Add Asset</button>
      </div>
      <div style={{ display:"flex",gap:8,marginBottom:22 }}>
        {["All","Stocks","Crypto","Savings"].map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={{ background:filter===c?"#6366f1":"#fff",border:filter===c?"none":"1px solid #e2e8f0",borderRadius:20,color:filter===c?"#fff":"#64748b",padding:"7px 18px",cursor:"pointer",fontSize:13,fontWeight:500,fontFamily:"inherit" }}>{c}</button>
        ))}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16 }}>
        {filtered.map(a=>(
          <AssetCard key={a.id} asset={a} onEdit={a=>setEditing(a)} onDelete={id=>{if(confirm("Delete?"))deleteAsset(id);}}/>
        ))}
        {!filtered.length&&<div style={{ gridColumn:"1/-1",textAlign:"center",color:"#94a3b8",padding:60 }}>No assets found.</div>}
      </div>
      {showAdd&&<Modal title="Add New Asset" onClose={()=>setShowAdd(false)}><AssetForm onSave={a=>{addAsset(a);setShowAdd(false);}} onClose={()=>setShowAdd(false)}/></Modal>}
      {editing&&<Modal title="Edit Asset" onClose={()=>setEditing(null)}><AssetForm init={editing} onSave={a=>{updateAsset(a);setEditing(null);}} onClose={()=>setEditing(null)}/></Modal>}
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────
function AIAssistant() {
  const { assets } = usePort();
  const [msgs,    setMsgs   ] = useState([{ role:"ai", text:"Hello! I'm AssetSynx AI . I can answer any question about your portfolio using our graph engine, MPT, risk analysis, and more. Ask me anything!" }]);
  const [inp,     setInp    ] = useState("");
  const [loading, setLoading] = useState(false);
  const [status,  setStatus ] = useState("");
  const bottom = useRef(null);

  const send = async () => {
    if(!inp.trim()||loading) return;
    const question = inp;
    setInp("");
    setMsgs(m=>[...m,{ role:"user", text:question }]);
    setLoading(true);

    try {
      setStatus("Analysing portfolio...");
      const reply = await apiCall("POST", "/chat", {
        portfolio: assets,
        question,
      });
      setMsgs(m=>[...m,{ role:"ai", text:reply.text, source:reply.source }]);
    } catch(e) {
      setMsgs(m=>[...m,{ role:"ai", text:"Backend unavailable. Make sure the backend is running on port 3001 and Ollama is running (ollama serve)." }]);
    } finally {
      setLoading(false);
      setStatus("");
      setTimeout(()=>bottom.current?.scrollIntoView({ behavior:"smooth" }), 80);
    }
  };

  const SUGG=["Is my portfolio risky?","Which assets are most correlated?","What does MPT suggest?","Explain my diversification score"];

  return (
    <div style={{ padding:"28px 28px 48px",background:"#f8fafc",display:"grid",gridTemplateColumns:"1fr 300px",gap:22,height:"calc(100vh - 56px)",boxSizing:"border-box" }}>
      <div style={{ display:"flex",flexDirection:"column",minHeight:0 }}>
        <h1 style={{ color:"#0f172a",fontSize:26,fontWeight:800,margin:"0 0 4px" }}>AI Assistant</h1>
        <p style={{ color:"#94a3b8",margin:"0 0 18px",fontSize:14 }}></p>
        <div style={{ flex:1,...S.card,display:"flex",flexDirection:"column",overflow:"hidden",padding:0,minHeight:0 }}>
          <div style={{ flex:1,overflowY:"auto",padding:"20px 20px 8px" }}>
            {msgs.map((m,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:14 }}>
                {m.role==="ai"&&<div style={{ width:32,height:32,borderRadius:"50%",background:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center",marginRight:10,flexShrink:0,marginTop:2,fontSize:13,fontWeight:700,color:"#fff" }}>A</div>}
                <div style={{ maxWidth:"75%",background:m.role==="user"?"#6366f1":"#f8fafc",border:m.role==="ai"?"1px solid #e2e8f0":"none",borderRadius:m.role==="user"?"14px 14px 3px 14px":"14px 14px 14px 3px",padding:"11px 15px",color:m.role==="user"?"#fff":"#1e293b",fontSize:14,lineHeight:1.65 }}>
                  {m.text}
                  {m.source&&<div style={{ fontSize:10,color:"#94a3b8",marginTop:6 }}>via {m.source}</div>}
                </div>
              </div>
            ))}
            {loading&&<div style={{ display:"flex",gap:6,padding:"8px 0" }}>{[0,1,2].map(i=><div key={i} style={{ width:8,height:8,borderRadius:"50%",background:"#6366f1",opacity:0.4,animation:`pulse 1s ${i*0.2}s infinite` }}/>)}</div>}
            <div ref={bottom}/>
          </div>
          <div style={{ padding:"0 16px 12px",display:"flex",gap:8,flexWrap:"wrap" }}>
            {SUGG.map(s=><button key={s} onClick={()=>setInp(s)} style={{ background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:20,color:"#6366f1",fontSize:12,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit" }}>{s}</button>)}
          </div>
          <div style={{ borderTop:"1px solid #f1f5f9",padding:"14px 16px",display:"flex",gap:10 }}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about your portfolio…" style={{ ...S.input,flex:1 }}/>
            <button onClick={send} disabled={loading} style={{ ...S.btn,display:"flex",alignItems:"center",gap:6,opacity:loading?0.7:1 }}><Ic.Send/> Send</button>
          </div>
        </div>
      </div>
      <div style={{ overflowY:"auto",paddingTop:52,display:"flex",flexDirection:"column",gap:16 }}>
        <div style={S.card}>
          <div style={{ color:"#0f172a",fontSize:13,fontWeight:700,marginBottom:14 }}>What I can analyse</div>
          {["Asset correlation & clusters","Concentration & VaR","MPT weight optimisation","Sector diversification","Data-driven risk score"].map(t=>(
            <div key={t} style={{ display:"flex",gap:8,alignItems:"flex-start",marginBottom:8 }}>
              <span style={{ color:"#10b981",fontSize:13,marginTop:1 }}>✓</span>
              <span style={{ color:"#64748b",fontSize:13 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ color:"#0f172a",fontSize:13,fontWeight:700,marginBottom:10 }}>How It Works</div>
          <div style={{ color:"#64748b",fontSize:12,lineHeight:1.8 }}>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────
function Settings() {
  const { assets, clearAssets, resetAssets } = usePort();
  return (
    <div style={{ padding:"28px 28px 48px",background:"#f8fafc",minHeight:"100%",maxWidth:580 }}>
      <h1 style={{ color:"#0f172a",fontSize:26,fontWeight:800,margin:"0 0 6px" }}>Settings</h1>
      <p style={{ color:"#94a3b8",margin:"0 0 26px",fontSize:14 }}>Manage data and configuration</p>
      <div style={{ ...S.card,marginBottom:16 }}>
        <div style={{ color:"#0f172a",fontSize:15,fontWeight:700,marginBottom:8 }}>Data</div>
        <p style={{ color:"#64748b",fontSize:14,marginBottom:20 }}>You have <strong style={{ color:"#6366f1" }}>{assets.length} assets</strong> in localStorage.</p>
        <div style={{ display:"flex",gap:12 }}>
          <button onClick={resetAssets} style={S.btnGhost}>Reset to Sample Data</button>
          <button onClick={()=>{ if(confirm("Clear all?")) clearAssets(); }} style={{ background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:9,color:"#ef4444",padding:"10px 18px",cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>Clear All</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{ color:"#0f172a",fontSize:15,fontWeight:700,marginBottom:10 }}>Backend</div>
        <div style={{ color:"#64748b",fontSize:13,lineHeight:1.7,marginBottom:14 }}>Start the backend before using Graph Insights or AI Assistant.</div>
        <div style={{ background:"#f8fafc",borderRadius:9,padding:"14px 16px",fontFamily:"monospace",fontSize:12,color:"#10b981",border:"1px solid #e2e8f0",lineHeight:2 }}>
          cd backend{"\n"}node server.js{"\n"}# Server runs on http://localhost:3001
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [tab,  setTab ] = useState("login");
  const [form, setForm] = useState({ name:"",email:"",password:"" });
  const [err,  setErr ] = useState("");
  const submit = () => {
    if(!form.email||!form.password){ setErr("Please fill all fields."); return; }
    if(tab==="signup"&&!form.name){ setErr("Name required."); return; }
    const name=tab==="signup"?form.name:(Store.get("asx_user",null)?.name||"Investor");
    if(tab==="signup") Store.set("asx_user",{ name,email:form.email });
    onLogin({ name,email:form.email,avatar:name.slice(0,2).toUpperCase() });
  };
  return (
    <div style={{ minHeight:"100vh",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:420,background:"#fff",border:"1px solid #e2e8f0",borderRadius:22,padding:"44px 40px",boxShadow:"0 8px 40px rgba(0,0,0,0.07)" }}>
        <div style={{ textAlign:"center",marginBottom:30 }}>
          <div style={{ width:54,height:54,borderRadius:14,background:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:26,fontWeight:800,color:"#fff" }}>A</div>
          <h1 style={{ color:"#0f172a",fontSize:22,fontWeight:800,margin:0 }}>AssetSynx AI</h1>
          <p style={{ color:"#94a3b8",fontSize:13,margin:"6px 0 0" }}>Graph Edition — intelligent portfolio analysis</p>
        </div>
        <div style={{ display:"flex",background:"#f8fafc",borderRadius:11,padding:4,marginBottom:24,border:"1px solid #e2e8f0" }}>
          {["login","signup"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1,background:tab===t?"#6366f1":"transparent",border:"none",borderRadius:8,color:tab===t?"#fff":"#94a3b8",padding:"9px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit" }}>{t==="login"?"Sign In":"Sign Up"}</button>
          ))}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {tab==="signup"&&<input style={S.input} placeholder="Full name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>}
          <input style={S.input} placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
          <input style={S.input} type="password" placeholder="Password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          {err&&<p style={{ color:"#ef4444",fontSize:13,margin:0 }}>{err}</p>}
          <button onClick={submit} style={{ ...S.btn,padding:"13px",fontSize:15 }}>{tab==="login"?"Sign In →":"Create Account →"}</button>
          <p style={{ color:"#cbd5e1",fontSize:12,textAlign:"center",margin:0 }}>Demo: any email + password works</p>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────
export default function App() {
  const [user,   setUser  ] = useState(()=>Store.get("asx_session",null));
  const [assets, setAssets] = useState(()=>Store.get("asx_assets",SEEDS));
  const [page,   setPage  ] = useState("dashboard");
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(()=>{ Store.set("asx_assets",assets); },[assets]);

  // Check backend health on load
  useEffect(()=>{
    apiCall("GET","/health")
      .then(()=>setBackendStatus("online"))
      .catch(()=>setBackendStatus("offline"));
  },[]);

  const port = {
    assets,
    addAsset:    a  => setAssets(p=>[...p,a]),
    updateAsset: a  => setAssets(p=>p.map(x=>x.id===a.id?a:x)),
    deleteAsset: id => setAssets(p=>p.filter(x=>x.id!==id)),
    clearAssets: () => setAssets([]),
    resetAssets: () => setAssets(SEEDS),
  };

  if(!user) return <Login onLogin={u=>{ setUser(u); Store.set("asx_session",u); }}/>;

  const PAGES = { dashboard:Dashboard, portfolio:Portfolio, analytics:Analytics, graph:GraphPage, ai:AIAssistant, settings:Settings };
  const Page  = PAGES[page]||Dashboard;

  return (
    <AuthCtx.Provider value={{ user }}>
      <PortCtx.Provider value={port}>
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.3);opacity:1} }`}</style>
        <div style={{ display:"flex",minHeight:"100vh",background:"#f8fafc",fontFamily:"'DM Sans','Outfit',system-ui,sans-serif" }}>
          <Sidebar active={page} setPage={setPage}/>
          <div style={{ flex:1,display:"flex",flexDirection:"column",minWidth:0 }}>
            <Topbar backendStatus={backendStatus}/>
            <div style={{ flex:1,overflowY:"auto" }}><Page/></div>
          </div>
        </div>
      </PortCtx.Provider>
    </AuthCtx.Provider>
  );
}
