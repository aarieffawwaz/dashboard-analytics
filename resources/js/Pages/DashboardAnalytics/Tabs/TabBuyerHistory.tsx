import React, { useState } from "react";
import {
    Network,
    Users,
    History,
    ShoppingBag,
    GitMerge,
    MapPin,
    Phone,
    Store,
    Building2,
    Utensils,
    HeartPulse,
    HandHeart,
    ShieldCheck,
    MessageCircle,
} from "lucide-react";
import { StatWidget } from "../Components/StatWidget";
import { DashboardProps } from "../type";

/* =========================================================
 * KONFIG KATEGORI MITRA
 * Tiap kategori punya warna aksen, ikon fallback, dan label
 * "sumber data" biar kelihatan kayak hasil integrasi API beneran.
 * ========================================================= */
type KategoriKey = "mbg" | "kesehatan" | "bansos" | "instansi";

const KATEGORI: Record<
    KategoriKey,
    {
        label: string;
        sumber: string;
        accent: string;
        accentSoft: string;
        tint: string;
        glow: string;
        icon: React.ReactNode;
        logo?: string; // logo resmi instansi (fallback kalau r.logo kosong)
    }
> = {
    mbg: {
        label: "Makan Bergizi Gratis",
        sumber: "Dapodik · BGN",
        accent: "#64748b",
        accentSoft: "#f1f5f9",
        tint: "rgba(248, 250, 252, 0.85)",
        glow: "rgba(148, 163, 184, 0.12)",
        icon: <Utensils size={24} />,
        // Badan Gizi Nasional (operator resmi MBG)
        logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20Badan%20Gizi%20Nasional%20(2024).png?width=160",
    },
    kesehatan: {
        label: "Fasilitas Kesehatan",
        sumber: "SatuSehat Kemenkes",
        accent: "#64748b",
        accentSoft: "#f1f5f9",
        tint: "rgba(248, 250, 252, 0.85)",
        glow: "rgba(148, 163, 184, 0.12)",
        icon: <HeartPulse size={24} />,
        // Kemenkes RI — emblem Bakti Husada (versi PNG, nama file valid di Commons)
        logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20of%20the%20Ministry%20of%20Health%20of%20the%20Republic%20of%20Indonesia.png?width=200",
    },
    bansos: {
        label: "Bantuan Sosial",
        sumber: "Bappenas · DTKS",
        accent: "#64748b",
        accentSoft: "#f1f5f9",
        tint: "rgba(248, 250, 252, 0.85)",
        glow: "rgba(148, 163, 184, 0.12)",
        icon: <HandHeart size={24} />,
        // Kementerian Sosial RI (pengelola DTKS / Bansos)
        logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20of%20the%20Ministry%20of%20Social%20Affairs%20of%20the%20Republic%20of%20Indonesia.svg?width=160",
    },
    instansi: {
        label: "Instansi Mitra",
        sumber: "Kora Think",
        accent: "#64748b",
        accentSoft: "#f1f5f9",
        tint: "rgba(248, 250, 252, 0.85)",
        glow: "rgba(148, 163, 184, 0.12)",
        icon: <Building2 size={24} />,
    },
};

// Kalau backend belum kirim field `kategori`, tebak otomatis dari nama buyer.
function tebakKategori(buyer = "", explicit?: string): KategoriKey {
    if (explicit && explicit in KATEGORI) return explicit as KategoriKey;
    const s = buyer.toLowerCase();
    if (s.includes("mbg") || s.includes("dapur") || s.includes("gizi"))
        return "mbg";
    if (
        s.includes("puskesmas") ||
        s.includes("rsud") ||
        s.includes("faskes") ||
        s.includes("klinik") ||
        s.includes("sehat")
    )
        return "kesehatan";
    if (
        s.includes("bansos") ||
        s.includes("bantuan") ||
        s.includes("prioritas") ||
        s.includes("desa")
    )
        return "bansos";
    return "instansi";
}

/* Logo instansi: nyoba beberapa sumber SECARA BERURUTAN.
 * Contoh urutan: [r.logo, cfg.logo]. Kalau gambar pertama gagal load,
 * otomatis pindah ke sumber berikutnya; kalau semua habis baru jatuh
 * ke ikon kategori. Jadi satu URL rusak nggak bikin logo hilang total. */
const LogoImage = ({
    sources,
    fallback,
    accent,
}: {
    sources: (string | undefined)[];
    fallback: React.ReactNode;
    accent: string;
}) => {
    const valid = sources.filter(Boolean) as string[];
    const [idx, setIdx] = useState(0);

    if (idx >= valid.length) {
        return (
            <span style={{ color: accent, display: "flex" }}>{fallback}</span>
        );
    }

    return (
        <img
            key={valid[idx]}
            src={valid[idx]}
            alt="Logo Instansi"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onError={() => setIdx((i) => i + 1)}
        />
    );
};

export default function TabBuyerHistory({
    data,
    onOpenModal,
}: {
    data: DashboardProps["buyerHistory"];
    onOpenModal: Function;
}) {
    const [filter, setFilter] = useState<"all" | "terdekat">("all");

    const filteredRekomendasi = data.rekomendasi.filter((r) => {
        if (filter === "all") return true;
        if (filter === "terdekat") return r.jarak <= 3.0;
        return true;
    });

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
            }}
        >
            {/* WIDGET STATISTIK */}
            <div className="stat-grid">
                <StatWidget
                    tone="jaring"
                    badge="Jaringan"
                    badgeIcon={<Network size={12} />}
                    label="Total Entitas Buyer"
                    value={data.stats.totalBuyer}
                    unit="buyer"
                    icon={<Users size={82} strokeWidth={1} />}
                    description="Pelanggan unik koperasi."
                    onClick={() =>
                        onOpenModal("stat", {
                            title: "Total Entitas",
                            value: data.stats.totalBuyer,
                        })
                    }
                />
                <StatWidget
                    tone="riwayat"
                    badge="Database"
                    badgeIcon={<History size={12} />}
                    label="Log Transaksi"
                    value={data.stats.transaksiTercatat}
                    unit="transaksi"
                    icon={<ShoppingBag size={82} strokeWidth={1} />}
                    description="Pembelian sukses terekam."
                    onClick={() =>
                        onOpenModal("stat", {
                            title: "Log Transaksi",
                            value: data.stats.transaksiTercatat,
                        })
                    }
                />
                <StatWidget
                    tone="kora"
                    badge="Smart Match"
                    badgeIcon={<GitMerge size={12} />}
                    label="Peluang Suplai"
                    value={data.stats.rekomendasiDihasilkan}
                    unit="mitra"
                    icon={<GitMerge size={82} strokeWidth={1} />}
                    description="B2G Pipeline Kemenkop."
                    onClick={() =>
                        onOpenModal("stat", {
                            title: "Rekomendasi",
                            value: data.stats.rekomendasiDihasilkan,
                        })
                    }
                />
            </div>

            {/* AREA BAWAH: 2 KOLOM */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr",
                    gap: "20px",
                    alignItems: "start",
                }}
            >
                {/* KOLOM KIRI: KORA THINK PIPELINE */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    {/* Header & Filter (glass tipis) */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background:
                                "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.7))",
                            backdropFilter: "blur(12px) saturate(140%)",
                            WebkitBackdropFilter: "blur(12px) saturate(140%)",
                            padding: "16px",
                            borderRadius: "14px",
                            border: "1px solid rgba(226,232,240,0.9)",
                            boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
                        }}
                    >
                        <div>
                            <h3
                                style={{
                                    margin: "0 0 4px",
                                    fontSize: "16px",
                                    fontWeight: 800,
                                    color: "#0f172a",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                Kora Think Pipeline
                            </h3>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    color: "#64748b",
                                }}
                            >
                                Integrasi kebutuhan komoditas lintas
                                kementerian.
                            </p>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                background: "#f1f5f9",
                                padding: "4px",
                                borderRadius: "8px",
                                gap: "4px",
                            }}
                        >
                            {(["all", "terdekat"] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        border: "none",
                                        background:
                                            filter === f
                                                ? "#fff"
                                                : "transparent",
                                        color:
                                            filter === f
                                                ? "#0f172a"
                                                : "#64748b",
                                        fontWeight: filter === f ? 600 : 500,
                                        padding: "6px 14px",
                                        fontSize: "13px",
                                        borderRadius: "6px",
                                        boxShadow:
                                            filter === f
                                                ? "0 1px 2px rgba(0,0,0,0.05)"
                                                : "none",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {f === "all" ? "Semua" : "Terdekat"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Card Matching List */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                        }}
                    >
                        {filteredRekomendasi.map((r, i) => {
                            const k = tebakKategori(
                                r.buyer,
                                (r as any).kategori,
                            );
                            const cfg = KATEGORI[k];

                            return (
                                <div
                                    key={i}
                                    className="card-clickable"
                                    onClick={() => onOpenModal("match", r)}
                                    style={{
                                        position: "relative",
                                        overflow: "hidden",
                                        background: `linear-gradient(135deg, ${cfg.tint} 0%, rgba(255,255,255,0.78) 58%)`,
                                        backdropFilter:
                                            "blur(18px) saturate(150%)",
                                        WebkitBackdropFilter:
                                            "blur(18px) saturate(150%)",
                                        border: "1px solid rgba(255,255,255,0.65)",
                                        borderRadius: "16px",
                                        padding: "20px",
                                        boxShadow:
                                            "0 6px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7)",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {/* Glow aksen supaya efek kaca kebaca walau bg flat */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: -50,
                                            right: -50,
                                            width: 170,
                                            height: 170,
                                            borderRadius: "50%",
                                            background: cfg.glow,
                                            filter: "blur(44px)",
                                            pointerEvents: "none",
                                        }}
                                    />

                                    <div
                                        style={{
                                            position: "relative",
                                            display: "flex",
                                            gap: "16px",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        {/* Logo instansi di tile kaca bertema */}
                                        <div
                                            style={{
                                                width: "54px",
                                                height: "54px",
                                                borderRadius: "12px",
                                                background:
                                                    "rgba(255,255,255,0.75)",
                                                border: `1px solid ${cfg.accent}33`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                padding: "9px",
                                                boxShadow: `0 2px 8px ${cfg.accent}22`,
                                                backdropFilter: "blur(6px)",
                                                WebkitBackdropFilter:
                                                    "blur(6px)",
                                            }}
                                        >
                                            <LogoImage
                                                sources={[r.logo, cfg.logo]}
                                                accent={cfg.accent}
                                                fallback={cfg.icon}
                                            />
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {/* Baris judul + jarak */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "flex-start",
                                                    gap: "8px",
                                                    marginBottom: "6px",
                                                }}
                                            >
                                                <div style={{ minWidth: 0 }}>
                                                    {/* Pill kategori */}
                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "4px",
                                                            background:
                                                                cfg.accentSoft,
                                                            color: cfg.accent,
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            padding: "3px 8px",
                                                            borderRadius: "6px",
                                                            marginBottom: "6px",
                                                            letterSpacing:
                                                                "0.01em",
                                                        }}
                                                    >
                                                        {cfg.label}
                                                    </span>
                                                    <h4
                                                        style={{
                                                            margin: 0,
                                                            fontSize: "16px",
                                                            fontWeight: 700,
                                                            color: "#0f172a",
                                                        }}
                                                    >
                                                        {r.buyer}
                                                    </h4>
                                                </div>

                                                <span
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                        flexShrink: 0,
                                                        background:
                                                            "rgba(241,245,249,0.85)",
                                                        color: "#475569",
                                                        padding: "4px 8px",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    <MapPin size={12} />{" "}
                                                    {r.jarak} km
                                                </span>
                                            </div>

                                            {/* Kebutuhan spesifik — di-highlight dengan card pink */}
                                            <div
                                                style={{
                                                    background: "#fff1f2",
                                                    border: "1px solid #fecdd3",
                                                    borderLeft:
                                                        "4px solid #f43f5e",
                                                    padding: "12px 14px",
                                                    borderRadius: "10px",
                                                    marginTop: "8px",
                                                    marginBottom: "14px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "block",
                                                        fontSize: "10px",
                                                        fontWeight: 700,
                                                        letterSpacing: "0.06em",
                                                        textTransform:
                                                            "uppercase",
                                                        color: "#e11d48",
                                                        marginBottom: "4px",
                                                    }}
                                                >
                                                    Kebutuhan Suplai
                                                </span>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "13.5px",
                                                        color: "#9f1239",
                                                        fontWeight: 600,
                                                        lineHeight: "1.55",
                                                    }}
                                                >
                                                    {r.alasan}
                                                </p>
                                            </div>

                                            {/* Sumber data + Kontak + Action */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                    borderTop:
                                                        "1px solid rgba(241,245,249,0.9)",
                                                    paddingTop: "12px",
                                                    gap: "8px",
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <a
                                                    href={(r as any).wa || "#"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        color: "#475569",
                                                        textDecoration: "none",
                                                    }}
                                                >
                                                    <Phone size={14} />
                                                    <span
                                                        style={{
                                                            fontSize: "13px",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {r.kontak}
                                                    </span>
                                                </a>

                                                <a
                                                    href={(r as any).wa || "#"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        background: "#22c55e",
                                                        color: "#fff",
                                                        fontWeight: 600,
                                                        fontSize: "13px",
                                                        padding: "7px 12px",
                                                        borderRadius: "8px",
                                                        textDecoration: "none",
                                                        boxShadow:
                                                            "0 2px 8px rgba(34,197,94,0.35)",
                                                    }}
                                                >
                                                    <MessageCircle size={15} />
                                                    Chat via WhatsApp
                                                </a>
                                            </div>

                                            {/* Badge sumber API */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    marginTop: "10px",
                                                    fontSize: "11px",
                                                    color: "#94a3b8",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <ShieldCheck size={12} />
                                                Sumber: {cfg.sumber}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Empty state filter terdekat */}
                        {filteredRekomendasi.length === 0 && (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "40px",
                                    background: "rgba(255,255,255,0.7)",
                                    backdropFilter: "blur(10px)",
                                    WebkitBackdropFilter: "blur(10px)",
                                    border: "1px solid rgba(226,232,240,0.9)",
                                    borderRadius: "14px",
                                }}
                            >
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "14px",
                                        color: "#64748b",
                                        fontWeight: 500,
                                    }}
                                >
                                    Tidak ada mitra di radius terdekat (&lt;
                                    3km).
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* KOLOM KANAN: LOG PEMBELIAN */}
                <div
                    style={{
                        border: "1px solid rgba(226,232,240,0.9)",
                        borderRadius: "16px",
                        background:
                            "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.8))",
                        backdropFilter: "blur(12px) saturate(140%)",
                        WebkitBackdropFilter: "blur(12px) saturate(140%)",
                        overflow: "hidden",
                        boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
                    }}
                >
                    <div
                        style={{
                            padding: "16px",
                            background: "rgba(248,250,252,0.6)",
                            borderBottom: "1px solid rgba(226,232,240,0.9)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <Store size={18} color="#0f172a" />
                        <span
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#0f172a",
                            }}
                        >
                            Log Pembelian Teratas
                        </span>
                    </div>

                    {data.riwayat.length === 0 ? (
                        <div
                            style={{
                                padding: "44px 24px",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: 52,
                                    height: 52,
                                    margin: "0 auto 14px",
                                    borderRadius: "50%",
                                    background: "rgba(241,245,249,0.8)",
                                    border: "1px dashed #cbd5e1",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#94a3b8",
                                }}
                            >
                                <ShoppingBag size={22} />
                            </div>
                            <p
                                style={{
                                    margin: "0 0 4px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "#475569",
                                }}
                            >
                                Belum ada riwayat transaksi
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    color: "#94a3b8",
                                }}
                            >
                                Transaksi buyer akan muncul di sini setelah
                                terekam sistem.
                            </p>
                        </div>
                    ) : (
                        <div style={{ padding: "8px" }}>
                            {data.riwayat.map((b, i) => (
                                <div
                                    key={i}
                                    className="interactive-row"
                                    onClick={() => onOpenModal("buyer", b)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "12px",
                                        borderRadius: "8px",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "38px",
                                            height: "38px",
                                            background: "#f1f5f9",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#475569",
                                        }}
                                    >
                                        <Users size={18} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p
                                            style={{
                                                margin: "0 0 2px",
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                color: "#0f172a",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {b.nama}
                                        </p>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: "12px",
                                                color: "#64748b",
                                            }}
                                        >
                                            Konsumen Reguler
                                        </p>
                                    </div>
                                    <div
                                        style={{
                                            textAlign: "right",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span
                                            style={{
                                                background: "#f1f5f9",
                                                color: "#0f172a",
                                                padding: "4px 10px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {b.frekuensi} Trx
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
