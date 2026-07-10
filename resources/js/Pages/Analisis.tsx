import AppLayout from "@/Layouts/AppLayout";
import PageHeader from "@/Components/PageHeader";
import { Lightbulb } from "lucide-react";
import type { AnalisisRow } from "@/types";

interface Props {
    rows: AnalisisRow[];
}

function rekomendasi(row: AnalisisRow): string[] {
    const saran: string[] = [];
    if (row.rasio_terjual < 50)
        saran.push(
            "Sebagian besar stok belum terjual, coba posting sisa ke marketplace.",
        );
    if (row.margin_persen !== null && row.margin_persen < 15)
        saran.push(
            "Margin tipis, coba jual dalam bentuk olahan atau kemasan biar nilai jualnya naik.",
        );
    if (saran.length === 0)
        saran.push(
            "Performa produk ini sehat, pertahankan pola jual sekarang.",
        );
    return saran;
}

export default function Analisis({ rows }: Props) {
    return (
        <AppLayout>
            <PageHeader
                title="Analisis usaha"
                subtitle="Diurutkan dari produk yang paling butuh perhatian"
            />

            {rows.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Belum ada transaksi yang bisa dianalisis. Catat beberapa
                    transaksi beli dan jual dulu.
                </p>
            )}

            {rows.map((row) => (
                <div
                    key={row.produk}
                    className="card"
                    style={{ marginBottom: 12 }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8,
                        }}
                    >
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
                            {row.produk}
                        </p>
                        <span
                            style={{
                                fontSize: 13,
                                color: "var(--text-secondary)",
                            }}
                        >
                            {row.rasio_terjual}% terjual
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: 16,
                            marginBottom: 12,
                            fontSize: 13,
                            color: "var(--text-secondary)",
                        }}
                    >
                        <span>Beli: {row.total_beli} kg</span>
                        <span>Jual: {row.total_jual} kg</span>
                        <span>
                            Margin:{" "}
                            {row.margin_persen === null
                                ? "-"
                                : `${row.margin_persen}%`}
                        </span>
                    </div>
                    <div
                        style={{
                            borderTop: "1px solid var(--border)",
                            paddingTop: 10,
                        }}
                    >
                        {rekomendasi(row).map((s, i) => (
                            <p
                                key={i}
                                style={{ margin: "0 0 4px", fontSize: 13 }}
                            >
                                <Lightbulb
                                    size={14}
                                    style={{
                                        marginRight: 6,
                                        color: "var(--amber-600)",
                                        verticalAlign: -2,
                                    }}
                                />
                                {s}
                            </p>
                        ))}
                    </div>
                </div>
            ))}
        </AppLayout>
    );
}
