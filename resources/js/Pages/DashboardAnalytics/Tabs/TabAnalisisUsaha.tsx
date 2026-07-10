import {
    Boxes,
    Package2,
    Users,
    PiggyBank,
    CalendarCheck,
    Store,
    FileText,
    TrendingUp,
    AlertTriangle,
    ShieldCheck,
    Sparkles,
    CheckCircle2,
} from "lucide-react";
import { StatWidget } from "../Components/StatWidget";
import { DashboardProps, KesehatanKategori } from "../type";

const KATEGORI_ICON: Record<KesehatanKategori["key"], any> = {
    anggota: Users,
    simpanan: PiggyBank,
    rat: CalendarCheck,
    gerai: Store,
    aset: Boxes,
    dokumen: FileText,
    produk_transaksi: Package2,
};

const STATUS_STYLE: Record<
    string,
    { bg: string; color: string; label: string }
> = {
    sehat: { bg: "#dcfce7", color: "#10b981", label: "Sehat" },
    cukup: { bg: "#fef3c7", color: "#f59e0b", label: "Cukup" },
    kurang: { bg: "#fee2e2", color: "#ef4444", label: "Perlu Perhatian" },
};

export default function TabAnalisisUsaha({
    data,
    onOpenModal,
}: {
    data: DashboardProps["analisisUsaha"];
    onOpenModal: Function;
}) {
    const kategoriSehat = data.kategori.filter(
        (k) => k.status === "sehat",
    ).length;
    const kategoriPerhatian = data.kategori.filter(
        (k) => k.status !== "sehat",
    ).length;
    const statusTotal = STATUS_STYLE[data.statusUmum] ?? STATUS_STYLE.cukup;

    return (
        <div style={{ width: "100%" }}>
            <div className="stat-grid">
                <StatWidget
                    tone="panen"
                    badge="Skor Kesehatan"
                    badgeIcon={<ShieldCheck size={12} />}
                    label="Kesehatan Koperasi"
                    value={data.skorTotal}
                    unit="/ 100"
                    progress={data.skorTotal}
                    icon={<ShieldCheck size={82} strokeWidth={1} />}
                    description={`Status umum: ${statusTotal.label}. Dihitung dari 7 aspek koperasi.`}
                    onClick={() =>
                        onOpenModal("stat", {
                            title: "Skor Kesehatan Koperasi",
                            value: `${data.skorTotal} / 100`,
                            desc: `Status umum koperasi saat ini: ${statusTotal.label}. Skor ini adalah rata-rata tertimbang dari Anggota, Simpanan, RAT, Gerai, Aset, Dokumen, serta Produk & Transaksi.`,
                        })
                    }
                />
                <StatWidget
                    tone="tumbuh"
                    badge="Tren naik"
                    badgeIcon={<TrendingUp size={12} />}
                    label="Aspek Sehat"
                    value={kategoriSehat}
                    unit={`dari ${data.kategori.length} aspek`}
                    progress={Math.round(
                        (kategoriSehat / data.kategori.length) * 100,
                    )}
                    icon={<CheckCircle2 size={82} strokeWidth={1} />}
                    description="Aspek koperasi dengan kondisi sudah baik."
                    onClick={() =>
                        onOpenModal("stat", {
                            title: "Aspek Sehat",
                            value: kategoriSehat,
                            desc: "Aspek koperasi (dari 7 yang dinilai) yang sudah berada di skor sehat.",
                        })
                    }
                />
                <StatWidget
                    tone="awas"
                    badge="Perlu aksi"
                    badgeIcon={<AlertTriangle size={12} />}
                    label="Perlu Perhatian"
                    value={kategoriPerhatian}
                    unit="aspek"
                    icon={<AlertTriangle size={82} strokeWidth={1} />}
                    description="Aspek yang butuh tindak lanjut pengurus koperasi."
                    onClick={() =>
                        onOpenModal("stat", {
                            title: "Aspek Perlu Perhatian",
                            value: kategoriPerhatian,
                            desc: "Aspek berstatus cukup atau kurang. Prioritaskan aspek dengan bobot terbesar dulu.",
                        })
                    }
                />
                <StatWidget
                    tone="kora"
                    badge="Kora Think"
                    badgeIcon={<Sparkles size={12} />}
                    label="Rekomendasi Aktif"
                    value={data.rekomendasi.length}
                    unit="saran"
                    icon={<Sparkles size={82} strokeWidth={1} />}
                    description="Langkah konkret dari AI untuk naikkan skor."
                    onClick={() =>
                        onOpenModal("stat", {
                            title: "Rekomendasi Aktif",
                            value: data.rekomendasi.length,
                            desc: "Jumlah rekomendasi aksi yang disiapkan Kora Think untuk koperasi ini.",
                        })
                    }
                />
            </div>

            <div
                style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    backgroundColor: "#ffffff",
                    overflow: "hidden",
                    marginBottom: "16px",
                }}
            >
                <div
                    style={{
                        padding: "12px 16px",
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "6px",
                    }}
                >
                    <span
                        style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#0f172a",
                        }}
                    >
                        Rincian Kesehatan per Aspek
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        Update terakhir: {data.terakhirDihitung}
                    </span>
                </div>
                <div style={{ overflowX: "auto", width: "100%" }}>
                    <div style={{ minWidth: "680px" }}>
                        {data.kategori.map((row, i) => {
                            const Icon = KATEGORI_ICON[row.key] ?? Boxes;
                            const style =
                                STATUS_STYLE[row.status] ?? STATUS_STYLE.cukup;
                            return (
                                <div
                                    key={row.key}
                                    className="interactive-row"
                                    onClick={() =>
                                        onOpenModal("kesehatan_kategori", row)
                                    }
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "1.6fr 2.6fr 0.9fr 1fr",
                                        gap: "16px",
                                        padding: "16px",
                                        borderBottom:
                                            i < data.kategori.length - 1
                                                ? "1px solid #f1f5f9"
                                                : "none",
                                        alignItems: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: "10px",
                                                background: style.bg,
                                                borderRadius: "8px",
                                                color: style.color,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Icon size={18} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    color: "#0f172a",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                }}
                                            >
                                                {row.label}
                                                {row.isBeta && (
                                                    <span
                                                        style={{
                                                            fontSize: "10px",
                                                            fontWeight: "700",
                                                            color: "#0284c7",
                                                            background:
                                                                "#e0f2fe",
                                                            padding: "2px 6px",
                                                            borderRadius:
                                                                "999px",
                                                        }}
                                                    >
                                                        Beta
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "11px",
                                                    color: "#94a3b8",
                                                }}
                                            >
                                                Bobot {row.bobot}% dari skor
                                                total
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#475569",
                                            lineHeight: "1.5",
                                        }}
                                    >
                                        {row.catatan}
                                    </div>
                                    <div>
                                        <span
                                            style={{
                                                fontSize: "11px",
                                                fontWeight: "700",
                                                color: style.color,
                                                background: style.bg,
                                                padding: "4px 10px",
                                                borderRadius: "999px",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {style.label}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            justifyContent: "flex-end",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "60px",
                                                height: "4px",
                                                borderRadius: "2px",
                                                background: "#f1f5f9",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${row.skor}%`,
                                                    height: "100%",
                                                    background: style.color,
                                                }}
                                            ></div>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                color: "#64748b",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {row.skor}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {data.rekomendasi.length > 0 && (
                <div
                    style={{
                        border: "1px solid #bae6fd",
                        borderRadius: "8px",
                        backgroundColor: "#f0f9ff",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #bae6fd",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <Sparkles size={16} color="#0284c7" />
                        <span
                            style={{
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "#0369a1",
                            }}
                        >
                            Rekomendasi Kora Think untuk Naikkan Skor
                        </span>
                    </div>
                    <div style={{ padding: "8px 16px 16px" }}>
                        {data.rekomendasi.map((r, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                    padding: "10px 0",
                                    borderBottom:
                                        i < data.rekomendasi.length - 1
                                            ? "1px dashed #bae6fd"
                                            : "none",
                                    fontSize: "13px",
                                    color: "#0c4a6e",
                                    lineHeight: "1.5",
                                }}
                            >
                                <CheckCircle2
                                    size={16}
                                    color="#0284c7"
                                    style={{
                                        flexShrink: 0,
                                        marginTop: "2px",
                                    }}
                                />
                                <span>{r}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
