import {
    Boxes,
    PackagePlus,
    TrendingUp,
    Rocket,
    Lightbulb,
    ArrowUpRight,
} from "lucide-react";
import { StatWidget } from "../Components/StatWidget";
import { DashboardProps } from "../type"; 

export default function TabNilaiTambah({
    data,
    onOpenModal,
}: {
    data: DashboardProps["nilaiTambah"];
    onOpenModal: Function;
}) {
    return (
        <div style={{ width: "100%" }}>
            <div className="stat-grid">
                <StatWidget
                    tone="panen"
                    badge="Terindeks"
                    badgeIcon={<Boxes size={12} />}
                    label="Katalog Analisis"
                    value={data.stats.produkDianalisis}
                    unit="komoditas"
                    icon={<PackagePlus size={82} strokeWidth={1} />}
                    description="Produk mentah dievaluasi."
                    onClick={() =>
                        onOpenModal("stat", {
                            title: "Katalog Analisis",
                            value: data.stats.produkDianalisis,
                            desc: "Evaluasi sistem.",
                        })
                    }
                />
                <StatWidget
                    tone="awas"
                    badge="Tren naik"
                    badgeIcon={<TrendingUp size={12} />}
                    label="Potensi Kenaikan"
                    value={data.stats.potensiPeningkatan}
                    icon={<TrendingUp size={82} strokeWidth={1} />}
                    description="Estimasi lonjakan margin."
                    onClick={() =>
                        onOpenModal("stat", {
                            title: "Potensi Kenaikan",
                            value: data.stats.potensiPeningkatan,
                            desc: "Prediksi cuan.",
                        })
                    }
                />
                <StatWidget
                    tone="kora"
                    badge="Siap eksekusi"
                    badgeIcon={<Rocket size={12} />}
                    label="Aksi Tereksekusi"
                    value={data.stats.rekomendasiSiapEksekusi}
                    unit="rekomendasi"
                    icon={<Rocket size={82} strokeWidth={1} />}
                    description="Layak diimplementasi hari ini."
                    onClick={() =>
                        onOpenModal("stat", {
                            title: "Aksi Tereksekusi",
                            value: data.stats.rekomendasiSiapEksekusi,
                            desc: "Rekomendasi taktis.",
                        })
                    }
                />
            </div>

            <div
                style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    background: "#fff",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "12px 16px",
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                    }}
                >
                    <span style={{ fontSize: "13px", fontWeight: "600" }}>
                        Rekomendasi Skalabilitas
                    </span>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <div style={{ minWidth: "500px" }}>
                        {data.rekomendasi.map((r, i) => (
                            <div
                                key={i}
                                className="interactive-row"
                                onClick={() => onOpenModal("nilai_tambah", r)}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1.5fr 3fr 2fr",
                                    gap: "16px",
                                    padding: "16px",
                                    borderBottom: "1px solid #f1f5f9",
                                }}
                            >
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <div
                                        style={{
                                            padding: "10px",
                                            background: "#e0f2fe",
                                            borderRadius: "8px",
                                            color: "#0ea5e9",
                                        }}
                                    >
                                        <Lightbulb size={20} />
                                    </div>
                                    <h3
                                        style={{
                                            margin: "0 0 6px",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {r.produk}
                                    </h3>
                                </div>
                                <p
                                    style={{
                                        fontSize: "13px",
                                        color: "#475569",
                                        margin: 0,
                                    }}
                                >
                                    {r.insightGabungan}
                                </p>
                                <div
                                    style={{
                                        background: "#f8fafc",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "6px",
                                        padding: "10px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "10px",
                                            fontWeight: "600",
                                            color: "#64748b",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        Action Item
                                    </span>
                                    <p
                                        style={{
                                            fontSize: "12px",
                                            color: "#0f172a",
                                            fontWeight: "500",
                                            margin: 0,
                                            display: "flex",
                                            gap: "6px",
                                        }}
                                    >
                                        <ArrowUpRight
                                            size={14}
                                            color="#0ea5e9"
                                        />
                                        {r.aksi}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
