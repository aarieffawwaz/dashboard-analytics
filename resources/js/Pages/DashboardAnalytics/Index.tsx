import { useState, useEffect } from "react";
import AppLayout from "@/Layouts/AppLayout";
import Modal from "@/Components/Modal";
import { router } from "@inertiajs/react";
import {
    LineChart,
    MapIcon,
    Users,
    PackagePlus,
    Bell,
    Fingerprint,
    Calendar,
    Activity,
    Sparkles,
    HelpCircle,
    UserCircle2,
    ChevronDown,
    LogOut,
    ChevronRight,
    Repeat,
} from "lucide-react";
import { DashboardProps } from "./type";

import TabAnalisisUsaha from "./Tabs/TabAnalisisUsaha";
import TabPetaPotensi from "./Tabs/TabPetaPotensi";
import TabBuyerHistory from "./Tabs/TabBuyerHistory";
import TabNilaiTambah from "./Tabs/TabNilaiTambah";

export default function DashboardAnalytics(props: DashboardProps) {
    const koperasi = props.koperasi;

    const [activeTab, setActiveTab] = useState("q2");
    const [selectedData, setSelectedData] = useState<{
        type: string;
        data: any;
    } | null>(null);

    const [showIntroModal, setShowIntroModal] = useState(false);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [isNotifRead, setIsNotifRead] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [logoutConfirm, setLogoutConfirm] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem("hasSeenAnalyticsIntro")) {
            setShowIntroModal(true);
        }
    }, []);

    const closeIntroModal = () => {
        localStorage.setItem("hasSeenAnalyticsIntro", "true");
        setShowIntroModal(false);
    };

    const handleLogout = () => {
        router.post("/logout");
    };

    const tabs = [
        { key: "q1", label: "Analisis Usaha", icon: LineChart },
        { key: "q2", label: "Potensi Desa", icon: MapIcon },
        { key: "q3", label: "Data Buyer", icon: Users },
        { key: "q4", label: "Nilai Tambah", icon: PackagePlus },
    ];

    // ---------- ISI MODAL DETAIL (dipanggil dari Tab lewat onOpenModal) ----------
    const renderModalContent = () => {
        if (!selectedData) return null;
        const { type, data } = selectedData;

        if (type === "stat") {
            return (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            padding: "16px",
                            background: "#f1f5f9",
                            borderRadius: "50%",
                            color: "#1e5b65",
                            marginBottom: "16px",
                        }}
                    >
                        <Activity size={32} />
                    </div>
                    <h2
                        style={{
                            fontSize: "36px",
                            fontWeight: "800",
                            color: "#0f172a",
                            margin: "0 0 4px 0",
                        }}
                    >
                        {data.value}
                    </h2>
                    <p
                        style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1e5b65",
                            margin: "0 0 20px 0",
                        }}
                    >
                        {data.title}
                    </p>
                    <div
                        style={{
                            background: "#f8fafc",
                            padding: "16px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            textAlign: "left",
                        }}
                    >
                        <strong
                            style={{
                                fontSize: "12px",
                                color: "#64748b",
                                textTransform: "uppercase",
                            }}
                        >
                            Detail Wawasan Sistem
                        </strong>
                        <p
                            style={{
                                margin: "6px 0 0",
                                fontSize: "14px",
                                lineHeight: "1.5",
                                color: "#475569",
                            }}
                        >
                            {data.desc}
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        paddingBottom: "16px",
                        borderBottom: "1px dashed #e2e8f0",
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <span
                            style={{
                                fontSize: "11px",
                                color: "#64748b",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            <Fingerprint size={12} /> ID Referensi:
                        </span>
                        <span
                            style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                fontFamily: "monospace",
                            }}
                        >
                            {koperasi.ref}
                        </span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <span
                            style={{
                                fontSize: "11px",
                                color: "#64748b",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            <Calendar size={12} /> Terakhir Dianalisis:
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: "600" }}>
                            Hari ini, 08:30 WIB
                        </span>
                    </div>
                </div>

                {type === "analisis" && (
                    <>
                        <div>
                            <strong
                                style={{ fontSize: "12px", color: "#64748b" }}
                            >
                                Produk Terkait
                            </strong>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                }}
                            >
                                {data.produk}
                            </p>
                        </div>
                        <div>
                            <strong
                                style={{ fontSize: "12px", color: "#64748b" }}
                            >
                                Status Performa
                            </strong>
                            <p style={{ margin: "4px 0 0", fontSize: "14px" }}>
                                {data.status === "optimal"
                                    ? "✅ Optimal & Stabil"
                                    : "⚠️ Butuh Perhatian Khusus"}
                            </p>
                        </div>
                        <div
                            style={{
                                background: "#f8fafc",
                                padding: "12px",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <strong
                                style={{
                                    fontSize: "12px",
                                    color: "#0ea5e9",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <Sparkles size={14} /> Wawasan Kora Think
                            </strong>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: "13px",
                                    lineHeight: "1.5",
                                }}
                            >
                                {data.catatan}
                            </p>
                        </div>
                    </>
                )}

                {type === "buyer" && (
                    <>
                        <div>
                            <strong
                                style={{ fontSize: "12px", color: "#64748b" }}
                            >
                                Nama Buyer / Entitas
                            </strong>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                }}
                            >
                                {data.nama}
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <div>
                                <strong
                                    style={{
                                        fontSize: "12px",
                                        color: "#64748b",
                                    }}
                                >
                                    Produk Sering Dibeli
                                </strong>
                                <p
                                    style={{
                                        margin: "4px 0 0",
                                        fontSize: "14px",
                                    }}
                                >
                                    {data.produkDibeli}
                                </p>
                            </div>
                            <div>
                                <strong
                                    style={{
                                        fontSize: "12px",
                                        color: "#64748b",
                                    }}
                                >
                                    Frekuensi (Bulan Ini)
                                </strong>
                                <p
                                    style={{
                                        margin: "4px 0 0",
                                        fontSize: "14px",
                                        fontWeight: "700",
                                    }}
                                >
                                    {data.frekuensi}x Transaksi
                                </p>
                            </div>
                        </div>
                        <div>
                            <strong
                                style={{ fontSize: "12px", color: "#64748b" }}
                            >
                                Kategori Preferensi
                            </strong>
                            <p style={{ margin: "4px 0 0", fontSize: "14px" }}>
                                {data.kategoriPreferensi}
                            </p>
                        </div>
                    </>
                )}

                {type === "match" && (
                    <>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "12px",
                                background: "#f1f5f9",
                                borderRadius: "6px",
                            }}
                        >
                            <div>
                                <strong
                                    style={{
                                        fontSize: "11px",
                                        color: "#64748b",
                                    }}
                                >
                                    Suplai (Desa)
                                </strong>
                                <p
                                    style={{
                                        margin: 0,
                                        fontWeight: "600",
                                        fontSize: "14px",
                                    }}
                                >
                                    {data.desa}
                                </p>
                            </div>
                            <ChevronRight size={16} color="#94a3b8" />
                            <div>
                                <strong
                                    style={{
                                        fontSize: "11px",
                                        color: "#64748b",
                                    }}
                                >
                                    Demand (Buyer)
                                </strong>
                                <p
                                    style={{
                                        margin: 0,
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        color: "#2b7a86",
                                    }}
                                >
                                    {data.buyer}
                                </p>
                            </div>
                        </div>
                        <div
                            style={{
                                background: "#f8fafc",
                                padding: "12px",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <strong
                                style={{
                                    fontSize: "12px",
                                    color: "#0ea5e9",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <Sparkles size={14} /> Logika Kora Think
                            </strong>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: "13px",
                                    lineHeight: "1.5",
                                }}
                            >
                                {data.alasan}
                            </p>
                        </div>
                    </>
                )}

                {type === "nilai_tambah" && (
                    <>
                        <div>
                            <strong
                                style={{ fontSize: "12px", color: "#64748b" }}
                            >
                                Target Produk
                            </strong>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: "16px",
                                    fontWeight: "700",
                                }}
                            >
                                {data.produk}
                            </p>
                        </div>
                        <div>
                            <strong
                                style={{ fontSize: "12px", color: "#64748b" }}
                            >
                                Estimasi Dampak Ekonomi
                            </strong>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: "14px",
                                    color: "#10b981",
                                    fontWeight: "600",
                                }}
                            >
                                {data.dampakEstimasi}
                            </p>
                        </div>
                        <div
                            style={{
                                background: "#f8fafc",
                                padding: "12px",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <strong
                                style={{
                                    fontSize: "12px",
                                    color: "#0ea5e9",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <Sparkles size={14} /> Wawasan Kora Think
                            </strong>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: "13px",
                                    lineHeight: "1.5",
                                }}
                            >
                                {data.insightGabungan}
                            </p>
                        </div>
                        <div
                            style={{
                                background: "#f0f9ff",
                                border: "1px solid #bae6fd",
                                padding: "12px",
                                borderRadius: "6px",
                            }}
                        >
                            <strong
                                style={{ fontSize: "12px", color: "#0369a1" }}
                            >
                                Rekomendasi Aksi (Siap Eksekusi)
                            </strong>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    color: "#0c4a6e",
                                }}
                            >
                                {data.aksi}
                            </p>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <AppLayout>
            {/* MODAL INTRO DASHBOARD */}
            {showIntroModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 99999,
                        background: "rgba(15, 23, 42, 0.4)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px",
                        animation: "fadeIn 0.3s ease-out",
                    }}
                >
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "20px",
                            overflow: "hidden",
                            width: "100%",
                            maxWidth: "860px",
                            display: "flex",
                            flexDirection: "row",
                            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                            animation: "slideUp 0.4s ease-out",
                        }}
                    >
                        <div
                            style={{
                                width: "340px",
                                background:
                                    "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "32px",
                                borderRight: "1px solid #e2e8f0",
                            }}
                        >
                            <img
                                src="/images/simkopdes.png"
                                alt="Mascot Kora"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "280px",
                                    objectFit: "contain",
                                    filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                flex: 1,
                                padding: "48px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                            }}
                        >
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "#e0f2fe",
                                    color: "#0284c7",
                                    padding: "6px 12px",
                                    borderRadius: "20px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    marginBottom: "20px",
                                    width: "fit-content",
                                }}
                            >
                                <Sparkles size={14} /> Analytics Engine
                                Teraktivasi
                            </div>
                            <h2
                                style={{
                                    fontSize: "28px",
                                    fontWeight: "800",
                                    color: "#0f172a",
                                    marginBottom: "16px",
                                    lineHeight: "1.2",
                                }}
                            >
                                Halo, {koperasi.nama}! <br />
                                <span style={{ color: "#1e5b65" }}>
                                    Ini Dashboard Analytics-mu
                                </span>
                            </h2>
                            <p
                                style={{
                                    color: "#475569",
                                    fontSize: "15px",
                                    lineHeight: "1.6",
                                    marginBottom: "32px",
                                }}
                            >
                                Semua angka di halaman ini dihitung dari wilayah{" "}
                                <strong>{koperasi.wilayah}</strong>. Kamu bisa
                                memantau performa produk, menganalisis potensi
                                komoditas desa, mencocokkan suplai dengan demand
                                buyer terdekat, hingga mendapatkan rekomendasi
                                skalabilitas — semua dianalisis oleh{" "}
                                <strong>Kora Think</strong>.
                            </p>
                            <button
                                onClick={closeIntroModal}
                                style={{
                                    background: "#1e5b65",
                                    color: "#ffffff",
                                    padding: "12px 24px",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    border: "none",
                                    cursor: "pointer",
                                    width: "fit-content",
                                    boxShadow:
                                        "0 4px 12px rgba(30, 91, 101, 0.3)",
                                }}
                            >
                                Mulai Eksplorasi Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL (kartu statistik & baris tabel) */}
            <Modal
                open={!!selectedData}
                onClose={() => setSelectedData(null)}
                title="Detail Wawasan"
            >
                {renderModalContent()}
            </Modal>

            {/* MODAL NOTIFIKASI */}
            <Modal
                open={showNotifModal}
                onClose={() => setShowNotifModal(false)}
                title="Pemberitahuan Sistem"
            >
                <div style={{ padding: "10px 0" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "16px",
                        }}
                    >
                        <div
                            style={{
                                padding: "12px",
                                background: "#e0f2fe",
                                borderRadius: "50%",
                                color: "#0ea5e9",
                            }}
                        >
                            <Bell size={24} />
                        </div>
                        <div>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: "16px",
                                    fontWeight: "700",
                                    color: "#0f172a",
                                }}
                            >
                                Peluang Pasar Baru Ditemukan!
                            </h3>
                            <span
                                style={{ fontSize: "12px", color: "#64748b" }}
                            >
                                Sistem Kora Think • Baru saja
                            </span>
                        </div>
                    </div>
                    <div
                        style={{
                            background: "#f8fafc",
                            padding: "16px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: "14px",
                                color: "#334155",
                                lineHeight: "1.5",
                            }}
                        >
                            Berdasarkan analisis log transaksi terbaru,{" "}
                            <strong>Kora Think</strong> mendeteksi ada{" "}
                            <strong>3 rekomendasi buyer terdekat</strong> dari
                            kawasan desamu yang sedang membutuhkan suplai
                            komoditas tinggi di bulan ini. Segera cek dan
                            lakukan matching!
                        </p>
                    </div>
                </div>
                <div
                    style={{
                        marginTop: "24px",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "12px",
                    }}
                >
                    <button
                        onClick={() => setShowNotifModal(false)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            background: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                        }}
                    >
                        Tutup
                    </button>
                    <button
                        onClick={() => {
                            setShowNotifModal(false);
                            setActiveTab("q3");
                        }}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            background: "#1e5b65",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                        }}
                    >
                        Lihat Data Buyer
                    </button>
                </div>
            </Modal>

            {/* MODAL KELUAR */}
            <Modal
                open={logoutConfirm}
                onClose={() => setLogoutConfirm(false)}
                title="Keluar dari koperasi ini?"
            >
                <p
                    style={{
                        fontSize: 14,
                        color: "#64748b",
                        marginBottom: 20,
                        lineHeight: 1.5,
                    }}
                >
                    Kamu akan kembali ke halaman pemilihan koperasi. Data{" "}
                    {koperasi.nama} tidak berubah.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        style={{
                            flex: 1,
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            cursor: "pointer",
                            fontWeight: "500",
                        }}
                        onClick={() => setLogoutConfirm(false)}
                    >
                        Batal
                    </button>
                    <button
                        style={{
                            flex: 1,
                            padding: "10px",
                            borderRadius: "6px",
                            border: "none",
                            background: "#ef4444",
                            color: "#ffffff",
                            fontWeight: "600",
                            cursor: "pointer",
                        }}
                        onClick={handleLogout}
                    >
                        Ya, keluar
                    </button>
                </div>
            </Modal>

            <div className="da-container">
                {/* TOPBAR */}
                <div
                    className="da-topbar"
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "16px",
                        width: "100%",
                        position: "relative",
                    }}
                >
                    <button
                        onClick={() => setShowIntroModal(true)}
                        title="Buka Intro Modal (Demo)"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "50%",
                            width: "40px",
                            height: "40px",
                            color: "#64748b",
                            cursor: "pointer",
                        }}
                    >
                        <HelpCircle size={20} />
                    </button>

                    <div
                        onClick={() => {
                            setShowNotifModal(true);
                            setIsNotifRead(true);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            background: isNotifRead ? "#f8fafc" : "#ffffff",
                            padding: "8px 16px",
                            borderRadius: "999px",
                            border: "1px solid #e2e8f0",
                            boxShadow: isNotifRead
                                ? "none"
                                : "0 2px 4px rgba(0,0,0,0.05)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                color: isNotifRead ? "#94a3b8" : "#0ea5e9",
                            }}
                        >
                            <Bell size={20} />
                            {!isNotifRead && (
                                <span
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        right: 0,
                                        width: "8px",
                                        height: "8px",
                                        background: "#ef4444",
                                        borderRadius: "50%",
                                        border: "2px solid #fff",
                                    }}
                                ></span>
                            )}
                        </div>
                        <span
                            style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: isNotifRead ? "#64748b" : "#0f172a",
                            }}
                        >
                            Notifikasi
                        </span>
                    </div>

                    <div style={{ position: "relative" }}>
                        <div
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                background: "#ffffff",
                                padding: "8px 16px",
                                borderRadius: "999px",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                                cursor: "pointer",
                                maxWidth: "320px",
                            }}
                        >
                            <div style={{ color: "#1e5b65", flexShrink: 0 }}>
                                <UserCircle2 size={24} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#0f172a",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {koperasi.nama}
                                </p>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "11px",
                                        color: "#64748b",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {koperasi.wilayah}
                                </p>
                            </div>
                            <ChevronDown
                                size={16}
                                color="#64748b"
                                style={{ flexShrink: 0 }}
                            />
                        </div>

                        {isProfileOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "110%",
                                    right: 0,
                                    width: "220px",
                                    background: "#ffffff",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow:
                                        "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                    zIndex: 50,
                                    padding: "8px",
                                }}
                            >
                                <a
                                    href="/ganti-koperasi"
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "10px",
                                        color: "#475569",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        borderRadius: "6px",
                                        textDecoration: "none",
                                    }}
                                >
                                    <Repeat size={16} /> Ganti koperasi
                                </a>
                                <button
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        setLogoutConfirm(true);
                                    }}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "10px",
                                        background: "transparent",
                                        border: "none",
                                        color: "#ef4444",
                                        fontWeight: "600",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        borderRadius: "6px",
                                        transition: "background 0.2s",
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background =
                                            "#fee2e2")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background =
                                            "transparent")
                                    }
                                >
                                    <LogOut size={16} /> Keluar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* GLASS HEADER + TABS */}
                <div className="da-glass-header">
                    <div className="da-glass-top">
                        <h2 className="da-glass-title">
                            Pilihlah menu sesuai kebutuhanmu
                        </h2>
                        <p className="da-glass-sub">
                            Eksplorasi wawasan dan data koperasi yang dianalisis
                            langsung oleh Kora Think AI.
                        </p>
                    </div>

                    <div className="da-glass-tabs">
                        {tabs.map((t) => {
                            const isActive = activeTab === t.key;
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => setActiveTab(t.key)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: isActive
                                            ? "linear-gradient(180deg, #2b7a86 0%, #1e5b65 100%)"
                                            : "transparent",
                                        color: isActive ? "#FFFFFF" : "#475569",
                                        fontWeight: "600",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        boxShadow: isActive
                                            ? "0 2px 6px rgba(30, 91, 101, 0.25)"
                                            : "none",
                                        transition: "all 0.2s ease",
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon
                                        size={16}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        style={{ opacity: isActive ? 1 : 0.6 }}
                                    />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* KONTEN TAB */}
                <div className="da-tab-content">
                    {activeTab === "q1" && (
                        <TabAnalisisUsaha
                            data={props.analisisUsaha}
                            onOpenModal={(type: string, data: any) =>
                                setSelectedData({ type, data })
                            }
                        />
                    )}
                    {activeTab === "q2" && (
                        <TabPetaPotensi
                            data={props.petaPotensi}
                            wilayah={koperasi.nama}
                            onOpenModal={(type: string, data: any) =>
                                setSelectedData({ type, data })
                            }
                        />
                    )}
                    {activeTab === "q3" && (
                        <TabBuyerHistory
                            data={props.buyerHistory}
                            onOpenModal={(type: string, data: any) =>
                                setSelectedData({ type, data })
                            }
                        />
                    )}
                    {activeTab === "q4" && (
                        <TabNilaiTambah
                            data={props.nilaiTambah}
                            onOpenModal={(type: string, data: any) =>
                                setSelectedData({ type, data })
                            }
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
