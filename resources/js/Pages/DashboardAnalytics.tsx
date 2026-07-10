import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import Modal from "@/Components/Modal";
import { router } from "@inertiajs/react";
import {
    Sparkles,
    MapPin,
    Users,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    AlertTriangle,
    ChevronRight,
    LineChart,
    Map as MapIcon, // WAJIB dialias: `Map` bentrok dengan Map bawaan JavaScript
    PackagePlus,
    ArrowUpRight,
    Package,
    ShoppingBag,
    Lightbulb,
    GitMerge,
    Fingerprint,
    Calendar,
    Activity,
    Target,
    Bell,
    UserCircle2,
    ChevronDown,
    HelpCircle,
    LogOut,
    Boxes,
    Rocket,
    Network,
    History,
    Wheat,
    Globe2,
    Building2,
    Layers,
    MousePointerClick,
} from "lucide-react";

interface AnalisisInsight {
    produk: string;
    status: "optimal" | "perhatian";
    confidence: number;
    catatan: string;
}
interface DesaPotensi {
    nama: string;
    lat: number;
    lng: number;
    komoditas: string;
    skorPotensi: number;
    catatanAI: string;
    koperasi?: string;
    kecamatan?: string;
    produksiTon?: number;
    kebutuhanPasar?: number;
}
interface BuyerRiwayat {
    nama: string;
    produkDibeli: string;
    frekuensi: number;
    kategoriPreferensi: string;
}
interface RekomendasiBuyer {
    desa: string;
    buyer: string;
    alasan: string;
}
interface RekomendasiNilaiTambah {
    produk: string;
    insightGabungan: string;
    aksi: string;
    dampakEstimasi: string;
}

interface Props {
    analisisUsaha: {
        stats: Record<string, number>;
        insights: AnalisisInsight[];
    };
    petaPotensi: { stats: Record<string, number>; desaList: DesaPotensi[] };
    buyerHistory: {
        stats: Record<string, number>;
        riwayat: BuyerRiwayat[];
        rekomendasi: RekomendasiBuyer[];
    };
    nilaiTambah: {
        stats: Record<string, number>;
        rekomendasi: RekomendasiNilaiTambah[];
    };
}

const tabs = [
    { key: "q1", label: "Analisis Usaha", icon: LineChart },
    { key: "q2", label: "Potensi Desa", icon: MapIcon },
    { key: "q3", label: "Data Buyer", icon: Users },
    { key: "q4", label: "Nilai Tambah", icon: PackagePlus },
] as const;

type TabKey = (typeof tabs)[number]["key"];

// --- HELPER UNTUK WARNA ICON SELANG-SELING TAB 1 ---
const getTab1RowColors = (index: number) => {
    const isGreen = index % 2 === 0;
    return isGreen
        ? { bg: "#dcfce7", color: "#10b981" }
        : { bg: "#fef3c7", color: "#f59e0b" };
};

/* =========================================================
   PALET KARTU STATISTIK — tiap "tone" punya makna, bukan urutan
   panen  : jumlah / katalog        (hijau padi)
   tumbuh : performa membaik        (teal)
   awas   : butuh tindakan          (kuning panen)
   kora   : output AI / brand       (teal tua)
   jaring : relasi & buyer          (ungu)
   riwayat: log transaksi           (pink)
   ========================================================= */
const TONES = {
    panen: {
        bg: "#f0f7e4",
        border: "#cfe4a8",
        badgeBg: "#dcecc0",
        strong: "#33500f",
        mid: "#5b7d24",
        ghost: "#d5e8b4",
    },
    tumbuh: {
        bg: "#e4f4f2",
        border: "#a5dcd4",
        badgeBg: "#c6e8e3",
        strong: "#0f4c47",
        mid: "#14807a",
        ghost: "#bfe4dd",
    },
    awas: {
        bg: "#fdf3e0",
        border: "#f5d79a",
        badgeBg: "#fae5bd",
        strong: "#6b3f05",
        mid: "#a9700d",
        ghost: "#f8e0ac",
    },
    kora: {
        bg: "#e6f2f4",
        border: "#a3cdd4",
        badgeBg: "#c8e2e6",
        strong: "#123b42",
        mid: "#1e5b65",
        ghost: "#bcdbe0",
    },
    jaring: {
        bg: "#f4ecfb",
        border: "#d8bdf0",
        badgeBg: "#e8d8f7",
        strong: "#4a2168",
        mid: "#7c3aad",
        ghost: "#e1cbf4",
    },
    riwayat: {
        bg: "#fdeaf2",
        border: "#f5bdd4",
        badgeBg: "#fad4e2",
        strong: "#6b1d3c",
        mid: "#b03465",
        ghost: "#f8cadb",
    },
} as const;

type ToneKey = keyof typeof TONES;

/* Empat kelas skor untuk peta. Batang, titik, dan legenda memakai skala
   yang sama, jadi tinggi dan warna tidak pernah bercerita hal berbeda. */
const KELAS = [
    { min: 85, label: "Sangat tinggi", rgb: [30, 91, 101], hex: "#1e5b65" },
    { min: 70, label: "Tinggi", rgb: [43, 122, 134], hex: "#2b7a86" },
    { min: 55, label: "Menengah", rgb: [155, 186, 75], hex: "#9bba4b" },
    { min: 0, label: "Perlu dorongan", rgb: [245, 185, 49], hex: "#f5b931" },
] as const;

const kelasDari = (skor: number) =>
    KELAS.find((k) => skor >= k.min) ?? KELAS[KELAS.length - 1];

function pusatDari(list: DesaPotensi[]): [number, number] {
    if (!list.length) return [117.0, -2.5]; // tengah Indonesia
    const lng = list.reduce((s, d) => s + d.lng, 0) / list.length;
    const lat = list.reduce((s, d) => s + d.lat, 0) / list.length;
    return [lng, lat];
}

// BADGE KORA THINK
function AiTag() {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                border: "1px solid #bbf7d0",
                color: "#16a34a",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                flexShrink: 0,
                textTransform: "uppercase",
            }}
        >
            <Sparkles size={12} color="#16a34a" />
            Kora Think
        </span>
    );
}

/* Angka menghitung naik saat kartu pertama kali muncul. */
function useCountUp(target: number, duration = 900) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (!Number.isFinite(target)) return;

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        if (reduced || target === 0) {
            setDisplay(target);
            return;
        }

        let frame = 0;
        const start = performance.now();

        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(target * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);

    return display;
}

function StatWidget({
    tone,
    label,
    value,
    unit,
    badge,
    badgeIcon,
    icon,
    description,
    progress,
    onClick,
}: {
    tone: ToneKey;
    label: string;
    value: number | string;
    unit?: string;
    badge: string;
    badgeIcon: React.ReactNode;
    icon: React.ReactNode;
    description: string;
    progress?: number;
    onClick: () => void;
}) {
    const t = TONES[tone];
    const isNumeric = typeof value === "number";
    const counted = useCountUp(isNumeric ? value : 0);

    return (
        <div
            className="stat-card"
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
            style={{ background: t.bg, border: `1px solid ${t.border}` }}
        >
            {/* Ikon dekoratif besar yang "bocor" di pojok */}
            <div className="stat-card__ghost" style={{ color: t.ghost }}>
                {icon}
            </div>

            <div style={{ position: "relative" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                    }}
                >
                    <span
                        className="stat-card__badge"
                        style={{ background: t.badgeBg, color: t.strong }}
                    >
                        {badgeIcon}
                        {badge}
                    </span>
                    <ArrowUpRight
                        className="stat-card__arrow"
                        size={16}
                        color={t.mid}
                    />
                </div>

                <span className="stat-card__label" style={{ color: t.mid }}>
                    {label}
                </span>

                <div
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "5px",
                        margin: "2px 0 0",
                    }}
                >
                    <span
                        className="stat-card__value"
                        style={{ color: t.strong }}
                    >
                        {isNumeric ? counted : value}
                    </span>
                    {unit && (
                        <span
                            className="stat-card__unit"
                            style={{ color: t.mid }}
                        >
                            {unit}
                        </span>
                    )}
                </div>

                {typeof progress === "number" && (
                    <div
                        className="stat-card__track"
                        style={{ background: t.badgeBg }}
                    >
                        <div
                            className="stat-card__bar"
                            style={{
                                width: `${Math.min(Math.max(progress, 0), 100)}%`,
                                background: t.mid,
                            }}
                        />
                    </div>
                )}

                <p className="stat-card__desc" style={{ color: t.mid }}>
                    {description}
                </p>
            </div>
        </div>
    );
}

/* Gauge donat untuk skor rata-rata wilayah. */
function SkorGauge({ skor }: { skor: number }) {
    const kelas = kelasDari(skor);
    const r = 52;
    const keliling = 2 * Math.PI * r;
    const terisi = (Math.min(skor, 100) / 100) * keliling;

    return (
        <div
            style={{
                position: "relative",
                width: 132,
                height: 132,
                flexShrink: 0,
            }}
        >
            <svg width="132" height="132" viewBox="0 0 132 132">
                <circle
                    cx="66"
                    cy="66"
                    r={r}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="11"
                />
                <circle
                    cx="66"
                    cy="66"
                    r={r}
                    fill="none"
                    stroke={kelas.hex}
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray={`${terisi} ${keliling}`}
                    transform="rotate(-90 66 66)"
                    style={{
                        transition:
                            "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)",
                    }}
                />
            </svg>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <span
                    style={{
                        fontSize: 30,
                        fontWeight: 800,
                        color: "#0f172a",
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {skor}
                </span>
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    dari 100
                </span>
            </div>
        </div>
    );
}

function BarisIndikator({
    label,
    nilai,
    maks,
    warna,
    satuan,
}: {
    label: string;
    nilai: number;
    maks: number;
    warna: string;
    satuan?: string;
}) {
    const persen = maks ? Math.min((nilai / maks) * 100, 100) : 0;
    return (
        <div style={{ marginBottom: 12 }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 5,
                }}
            >
                <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: warna,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {nilai.toLocaleString("id-ID")}
                    {satuan && (
                        <span
                            style={{
                                fontWeight: 500,
                                color: "#94a3b8",
                                marginLeft: 3,
                            }}
                        >
                            {satuan}
                        </span>
                    )}
                </span>
            </div>
            <div
                style={{
                    height: 6,
                    borderRadius: 3,
                    background: "#f1f5f9",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${persen}%`,
                        height: "100%",
                        background: warna,
                        borderRadius: 3,
                        transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                    }}
                />
            </div>
        </div>
    );
}

/* =========================================================
   TAB 2 — PETA GLOBE + BATANG 3D

   deck.gl menghitung posisi dengan matriks mercator, sehingga batang 3D
   akan salah tempat kalau proyeksi globe menyala. Karena itu: globe dipakai
   untuk pembukaan (titik native MapLibre yang memang globe-aware), lalu
   kamera mendarat dan proyeksi otomatis pindah ke mercator — di situ batang
   deck.gl muncul.

   Semua panggilan ke MapLibre/deck dibungkus try/catch. Kalau peta gagal,
   yang muncul kotak fallback, bukan layar putih.
   ========================================================= */
function TabPotensiDesa({
    desaList,
    wilayah = "Wilayah Koperasi",
}: {
    desaList: DesaPotensi[];
    wilayah?: string;
}) {
    const wadahRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const overlayRef = useRef<any>(null);
    const siapRef = useRef(false);

    const [terpilih, setTerpilih] = useState<DesaPotensi | null>(null);
    const [globe, setGlobe] = useState(true);
    const [pesanGagal, setPesanGagal] = useState<string | null>(null);

    /* ---------- Ringkasan wilayah, dihitung dari data ---------- */
    const ringkasan = useMemo(() => {
        if (!desaList.length) {
            return {
                skorRata: 0,
                tertinggi: null as DesaPotensi | null,
                komoditasDominan: "—",
                totalProduksi: 0,
                totalKebutuhan: 0,
                jumlahTinggi: 0,
            };
        }

        const skorRata = Math.round(
            desaList.reduce((s, d) => s + d.skorPotensi, 0) / desaList.length,
        );
        const tertinggi = desaList.reduce((a, b) =>
            b.skorPotensi > a.skorPotensi ? b : a,
        );

        // Komoditas ditulis "Bayam, Kangkung" — pecah dulu sebelum dihitung.
        const hitung = new Map<string, number>();
        desaList.forEach((d) =>
            d.komoditas
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean)
                .forEach((k) => hitung.set(k, (hitung.get(k) ?? 0) + 1)),
        );
        const komoditasDominan =
            [...hitung.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

        return {
            skorRata,
            tertinggi,
            komoditasDominan,
            totalProduksi: desaList.reduce(
                (s, d) => s + (d.produksiTon ?? 0),
                0,
            ),
            totalKebutuhan: desaList.reduce(
                (s, d) => s + (d.kebutuhanPasar ?? 0),
                0,
            ),
            jumlahTinggi: desaList.filter((d) => d.skorPotensi >= 70).length,
        };
    }, [desaList]);

    const selisih = ringkasan.totalProduksi - ringkasan.totalKebutuhan;
    const punyaDataProduksi =
        ringkasan.totalProduksi > 0 || ringkasan.totalKebutuhan > 0;

    const geojson = useMemo(
        () => ({
            type: "FeatureCollection",
            features: desaList.map((d) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [d.lng, d.lat] },
                properties: { nama: d.nama, skor: d.skorPotensi },
            })),
        }),
        [desaList],
    );

    /* ---------- Inisialisasi peta ---------- */
    useEffect(() => {
        const ML = (window as any).maplibregl;
        const DECK = (window as any).deck;

        if (!wadahRef.current) return;

        // Periksa dependensi satu per satu supaya pesannya berguna.
        if (!ML) {
            setPesanGagal(
                "maplibre-gl belum termuat. Cek tag <script> di layout.",
            );
            return;
        }
        if (typeof ML.Map?.prototype?.setProjection !== "function") {
            setPesanGagal(
                "maplibre-gl yang termuat bukan v5. Proyeksi globe butuh v5+.",
            );
            return;
        }
        if (!DECK?.MapboxOverlay || !DECK?.ColumnLayer) {
            setPesanGagal(
                "deck.gl belum termuat atau tidak membawa MapboxOverlay.",
            );
            return;
        }

        let map: any;
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const [lng, lat] = pusatDari(desaList);

        try {
            // Catatan: `projection` bukan opsi konstruktor MapLibre.
            // Globe diaktifkan lewat setProjection() setelah peta load.
            map = new ML.Map({
                container: wadahRef.current,
                style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
                center: [lng, lat],
                zoom: reduced ? 10.5 : 2.3,
                pitch: reduced ? 52 : 0,
                bearing: reduced ? -18 : 0,
            });

            map.addControl(
                new ML.NavigationControl({ visualizePitch: true }),
                "top-right",
            );

            // Overlaid (bukan interleaved) supaya aman dengan MapLibre v5.
            const overlay = new DECK.MapboxOverlay({
                interleaved: false,
                layers: [],
                getTooltip: ({ object }: any) =>
                    object && {
                        html: `<div style="font-family:Inter,sans-serif;padding:2px 4px">
                            <strong style="font-size:12px">${object.nama}</strong><br/>
                            <span style="font-size:11px;opacity:.75">${object.komoditas}</span><br/>
                            <span style="font-size:11px">Skor ${object.skorPotensi}/100</span>
                        </div>`,
                        style: {
                            background: "#0f172a",
                            color: "#fff",
                            borderRadius: "6px",
                            fontSize: "12px",
                        },
                    },
            });
            map.addControl(overlay);

            map.on("error", (e: any) =>
                console.warn("MapLibre:", e?.error ?? e),
            );

            map.on("load", () => {
                try {
                    if (!reduced) map.setProjection({ type: "globe" });

                    // Titik native MapLibre: satu-satunya yang benar posisinya
                    // saat proyeksi globe menyala.
                    map.addSource("desa", { type: "geojson", data: geojson });
                    map.addLayer({
                        id: "desa-titik",
                        type: "circle",
                        source: "desa",
                        paint: {
                            "circle-radius": [
                                "interpolate",
                                ["linear"],
                                ["zoom"],
                                2,
                                3.5,
                                8,
                                7,
                            ],
                            "circle-color": [
                                "step",
                                ["get", "skor"],
                                "#f5b931",
                                55,
                                "#9bba4b",
                                70,
                                "#2b7a86",
                                85,
                                "#1e5b65",
                            ],
                            "circle-stroke-width": 1.5,
                            "circle-stroke-color": "#ffffff",
                        },
                    });

                    siapRef.current = true;

                    if (reduced) {
                        setGlobe(false);
                        return;
                    }

                    // Bumi dulu, lalu terbang turun ke wilayah koperasi.
                    map.flyTo({
                        center: [lng, lat],
                        zoom: 10.5,
                        pitch: 52,
                        bearing: -18,
                        duration: 3200,
                        essential: true,
                    });
                    // Begitu kamera mendarat, pindah ke mercator agar batang akurat.
                    map.once("moveend", () => setGlobe(false));
                } catch (err) {
                    console.error("Gagal menyiapkan layer peta:", err);
                    setPesanGagal("Layer peta gagal disiapkan. Lihat console.");
                }
            });

            mapRef.current = map;
            overlayRef.current = overlay;
        } catch (err) {
            console.error("Gagal membuat peta:", err);
            setPesanGagal("Peta gagal dibuat. Lihat console untuk detail.");
            return;
        }

        const ro = new ResizeObserver(() => map.resize());
        ro.observe(wadahRef.current);

        return () => {
            ro.disconnect();
            siapRef.current = false;
            map.remove();
            mapRef.current = null;
            overlayRef.current = null;
        };
    }, [desaList, geojson]);

    /* ---------- Globe: titik native. Mercator: batang 3D deck.gl. ---------- */
    useEffect(() => {
        const map = mapRef.current;
        const overlay = overlayRef.current;
        const DECK = (window as any).deck;
        if (!map || !overlay || !DECK || !siapRef.current) return;

        try {
            map.setProjection({ type: globe ? "globe" : "mercator" });

            if (map.getLayer("desa-titik")) {
                map.setLayoutProperty(
                    "desa-titik",
                    "visibility",
                    globe ? "visible" : "none",
                );
            }

            overlay.setProps({
                layers: globe
                    ? []
                    : [
                          new DECK.ColumnLayer({
                              id: "potensi-desa",
                              data: desaList,
                              diskResolution: 6,
                              radius: 450,
                              extruded: true,
                              pickable: true,
                              autoHighlight: true,
                              highlightColor: [245, 185, 49, 230],
                              elevationScale: 90,
                              getPosition: (d: DesaPotensi) => [d.lng, d.lat],
                              getElevation: (d: DesaPotensi) => d.skorPotensi,
                              getFillColor: (d: DesaPotensi) => [
                                  ...kelasDari(d.skorPotensi).rgb,
                                  225,
                              ],
                              onClick: ({ object }: any) => {
                                  if (object)
                                      setTerpilih(object as DesaPotensi);
                              },
                          }),
                      ],
            });
        } catch (err) {
            console.error("Gagal mengganti mode peta:", err);
        }
    }, [globe, desaList]);

    const gantiProyeksi = () => {
        const map = mapRef.current;
        if (!map) return;
        const jadiGlobe = !globe;
        setGlobe(jadiGlobe);
        map.easeTo(
            jadiGlobe
                ? { zoom: 2.3, pitch: 0, bearing: 0, duration: 1600 }
                : { zoom: 10.5, pitch: 52, bearing: -18, duration: 1600 },
        );
    };

    const sorotDesa = (d: DesaPotensi) => {
        setTerpilih(d);
        if (globe) setGlobe(false);
        mapRef.current?.flyTo({
            center: [d.lng, d.lat],
            zoom: 12.5,
            pitch: 55,
            duration: 1400,
            essential: true,
        });
    };

    /* ---------- Narasi otomatis, dihitung dari angka di atas ---------- */
    const narasi = (() => {
        if (!desaList.length) return "Belum ada titik desa untuk dianalisis.";
        const bagian = [
            `Dari ${desaList.length} desa terpetakan, ${ringkasan.jumlahTinggi} di antaranya berskor 70 ke atas.`,
            `Komoditas yang paling sering muncul adalah ${ringkasan.komoditasDominan}.`,
        ];
        if (punyaDataProduksi) {
            bagian.push(
                selisih >= 0
                    ? `Produksi wilayah surplus ${selisih.toLocaleString("id-ID")} ton terhadap kebutuhan buyer sekitar — peluang menjual keluar wilayah.`
                    : `Produksi masih defisit ${Math.abs(selisih).toLocaleString("id-ID")} ton dari kebutuhan buyer sekitar — pasar lokal belum tertutupi.`,
            );
        }
        if (ringkasan.tertinggi) {
            bagian.push(
                `${ringkasan.tertinggi.nama} memimpin dengan skor ${ringkasan.tertinggi.skorPotensi}.`,
            );
        }
        return bagian.join(" ");
    })();

    return (
        <div style={{ width: "100%" }}>
            <div className="pd-grid">
                {/* ---------------- PETA ---------------- */}
                <div
                    className="pd-card"
                    style={{ display: "flex", flexDirection: "column" }}
                >
                    <div className="pd-head">
                        <span className="pd-title">
                            <Layers size={15} color="#1e5b65" />
                            Peta Potensi 3D
                        </span>
                        <button
                            className="pd-btn"
                            onClick={gantiProyeksi}
                            disabled={!!pesanGagal}
                        >
                            {globe ? (
                                <>
                                    <MapIcon size={14} /> Mode analisis 3D
                                </>
                            ) : (
                                <>
                                    <Globe2 size={14} /> Tampilan bumi
                                </>
                            )}
                        </button>
                    </div>

                    <div className="pd-map">
                        {pesanGagal ? (
                            <div className="pd-fallback">{pesanGagal}</div>
                        ) : (
                            <>
                                <div
                                    ref={wadahRef}
                                    style={{ position: "absolute", inset: 0 }}
                                />
                                <div className="pd-legend">
                                    <strong
                                        style={{
                                            fontSize: 10,
                                            color: "#64748b",
                                            textTransform: "uppercase",
                                            letterSpacing: ".5px",
                                        }}
                                    >
                                        Skor potensi
                                    </strong>
                                    {KELAS.map((k) => (
                                        <div
                                            key={k.label}
                                            className="pd-legend-row"
                                        >
                                            <span
                                                className="pd-swatch"
                                                style={{ background: k.hex }}
                                            />
                                            {k.label} ({k.min}+)
                                        </div>
                                    ))}
                                    <p
                                        style={{
                                            margin: "8px 0 0",
                                            fontSize: 10,
                                            color: "#94a3b8",
                                            maxWidth: 150,
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {globe
                                            ? "Zoom masuk untuk melihat batang 3D."
                                            : "Tinggi batang mengikuti skor."}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ---------------- PANEL RINGKASAN ---------------- */}
                <div className="pd-card">
                    <div className="pd-head">
                        <span className="pd-title">
                            <Building2 size={15} color="#1e5b65" />
                            {wilayah}
                        </span>
                        <AiTag />
                    </div>

                    <div className="pd-panel">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                            }}
                        >
                            <SkorGauge skor={ringkasan.skorRata} />
                            <div style={{ minWidth: 0 }}>
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: "#64748b",
                                        textTransform: "uppercase",
                                        letterSpacing: ".4px",
                                        fontWeight: 700,
                                    }}
                                >
                                    Skor rata-rata
                                </span>
                                <p
                                    style={{
                                        margin: "4px 0 8px",
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: kelasDari(ringkasan.skorRata)
                                            .hex,
                                    }}
                                >
                                    {kelasDari(ringkasan.skorRata).label}
                                </p>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 12,
                                        color: "#64748b",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {ringkasan.jumlahTinggi} dari{" "}
                                    {desaList.length} desa berskor tinggi.
                                </p>
                            </div>
                        </div>

                        <div
                            style={{
                                borderTop: "1px dashed #e2e8f0",
                                paddingTop: 14,
                            }}
                        >
                            <BarisIndikator
                                label="Skor tertinggi"
                                nilai={ringkasan.tertinggi?.skorPotensi ?? 0}
                                maks={100}
                                warna="#1e5b65"
                            />
                            {punyaDataProduksi && (
                                <>
                                    <BarisIndikator
                                        label="Produksi wilayah"
                                        nilai={ringkasan.totalProduksi}
                                        maks={Math.max(
                                            ringkasan.totalProduksi,
                                            ringkasan.totalKebutuhan,
                                        )}
                                        warna="#9bba4b"
                                        satuan="ton"
                                    />
                                    <BarisIndikator
                                        label="Kebutuhan buyer"
                                        nilai={ringkasan.totalKebutuhan}
                                        maks={Math.max(
                                            ringkasan.totalProduksi,
                                            ringkasan.totalKebutuhan,
                                        )}
                                        warna="#f5b931"
                                        satuan="ton"
                                    />
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color:
                                                selisih >= 0
                                                    ? "#0f766e"
                                                    : "#b45309",
                                        }}
                                    >
                                        {selisih >= 0 ? (
                                            <TrendingUp size={14} />
                                        ) : (
                                            <TrendingDown size={14} />
                                        )}
                                        {selisih >= 0 ? "Surplus " : "Defisit "}
                                        {Math.abs(selisih).toLocaleString(
                                            "id-ID",
                                        )}{" "}
                                        ton
                                    </div>
                                </>
                            )}
                        </div>

                        <div
                            style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: 8,
                                padding: 12,
                            }}
                        >
                            <strong
                                style={{
                                    fontSize: 11,
                                    color: "#1e5b65",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    textTransform: "uppercase",
                                    letterSpacing: ".4px",
                                }}
                            >
                                <Wheat size={13} /> Bacaan wilayah
                            </strong>
                            <p
                                style={{
                                    margin: "6px 0 0",
                                    fontSize: 12.5,
                                    lineHeight: 1.55,
                                    color: "#475569",
                                }}
                            >
                                {narasi}
                            </p>
                        </div>

                        {terpilih ? (
                            <div
                                style={{
                                    borderTop: "1px dashed #e2e8f0",
                                    paddingTop: 14,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        marginBottom: 10,
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 8,
                                            borderRadius: 8,
                                            background: "#ccfbf1",
                                            color: "#0d9488",
                                            lineHeight: 0,
                                        }}
                                    >
                                        <MapPin size={18} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 14,
                                                fontWeight: 700,
                                                color: "#0f172a",
                                            }}
                                        >
                                            {terpilih.nama}
                                        </p>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 11,
                                                color: "#64748b",
                                            }}
                                        >
                                            {terpilih.koperasi ??
                                                "Koperasi belum tercatat"}
                                            {terpilih.kecamatan
                                                ? ` • Kec. ${terpilih.kecamatan}`
                                                : ""}
                                        </p>
                                    </div>
                                    <span
                                        style={{
                                            marginLeft: "auto",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: kelasDari(
                                                terpilih.skorPotensi,
                                            ).hex,
                                        }}
                                    >
                                        {terpilih.skorPotensi}/100
                                    </span>
                                </div>
                                <p
                                    style={{
                                        margin: "0 0 6px",
                                        fontSize: 12.5,
                                        fontWeight: 600,
                                        color: "#0f172a",
                                    }}
                                >
                                    {terpilih.komoditas}
                                </p>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 12.5,
                                        color: "#475569",
                                        lineHeight: 1.55,
                                    }}
                                >
                                    {terpilih.catatanAI}
                                </p>
                            </div>
                        ) : (
                            <div className="pd-hint">
                                <MousePointerClick
                                    size={15}
                                    color="#94a3b8"
                                    style={{ flexShrink: 0 }}
                                />
                                Klik salah satu batang di peta untuk melihat
                                detail desanya.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ---------------- DAFTAR DESA ---------------- */}
            <div className="pd-card" style={{ marginTop: 16 }}>
                <div className="pd-head">
                    <span className="pd-title">Identifikasi Komoditas</span>
                    <AiTag />
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    {desaList.map((d, i) => {
                        const aktif = terpilih?.nama === d.nama;
                        return (
                            <div
                                key={d.nama}
                                className="pd-row"
                                role="button"
                                tabIndex={0}
                                onClick={() => sorotDesa(d)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        sorotDesa(d);
                                    }
                                }}
                                style={{
                                    background: aktif ? "#f0fdfa" : "#fff",
                                    borderLeft: `3px solid ${aktif ? kelasDari(d.skorPotensi).hex : "transparent"}`,
                                    borderBottom:
                                        i < desaList.length - 1
                                            ? "1px solid #f1f5f9"
                                            : "none",
                                }}
                            >
                                <div
                                    style={{
                                        padding: 10,
                                        background: "#ccfbf1",
                                        borderRadius: 8,
                                        color: "#0d9488",
                                        flexShrink: 0,
                                        lineHeight: 0,
                                    }}
                                >
                                    <MapPin size={20} />
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 8,
                                            marginBottom: 4,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: "#0f172a",
                                            }}
                                        >
                                            {d.nama}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                background: "#f1f5f9",
                                                padding: "2px 6px",
                                                borderRadius: 4,
                                                color: kelasDari(d.skorPotensi)
                                                    .hex,
                                                flexShrink: 0,
                                            }}
                                        >
                                            Score: {d.skorPotensi}
                                        </span>
                                    </div>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: "#0f172a",
                                            margin: "0 0 4px",
                                        }}
                                    >
                                        {d.komoditas}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            color: "#475569",
                                            margin: 0,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {d.catatanAI}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function DashboardAnalytics({
    analisisUsaha,
    petaPotensi,
    buyerHistory,
    nilaiTambah,
}: Props) {
    const [activeTab, setActiveTab] = useState<TabKey>("q1");
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
        const hasSeenIntro = localStorage.getItem("hasSeenAnalyticsIntro");
        if (!hasSeenIntro) {
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

    // Rasio untuk progress bar
    const rasioOptimal = analisisUsaha.stats.produkDianalisis
        ? Math.round(
              (analisisUsaha.stats.berpotensiOptimal /
                  analisisUsaha.stats.produkDianalisis) *
                  100,
          )
        : 0;

    const rasioKecocokan = petaPotensi.stats.desaTerpetakan
        ? Math.round(
              (petaPotensi.stats.kecocokanTinggi /
                  petaPotensi.stats.desaTerpetakan) *
                  100,
          )
        : 0;

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
                            SYS-{Math.floor(Math.random() * 10000)}
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
            {/* =========================================================
                MODAL INTRO DASHBOARD ANALYTICS
                ========================================================= */}
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
                                Halo! Selamat datang di <br />
                                <span style={{ color: "#1e5b65" }}>
                                    Dashboard Analytics
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
                                Di sini kamu bisa memantau performa produk
                                secara real-time, menganalisis potensi komoditas
                                desa, mencocokkan suplai dengan demand buyer
                                terdekat, hingga mendapatkan rekomendasi
                                skalabilitas. Semua dianalisis oleh{" "}
                                <strong>Kora Think</strong> untuk keputusan yang
                                lebih akurat.
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

            {/* MODAL NOTIFIKASI DEMO */}
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

            {/* MODAL LOGOUT KONFIRMASI */}
            <Modal
                open={logoutConfirm}
                onClose={() => setLogoutConfirm(false)}
                title="Keluar dari akun?"
            >
                <p
                    style={{
                        fontSize: 14,
                        color: "#64748b",
                        marginBottom: 20,
                        lineHeight: 1.5,
                    }}
                >
                    Kamu perlu login lagi untuk mengakses Dashboard Analytics
                    dan fitur Koperasi lainnya.
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

            <div
                className="da-container"
                style={{
                    fontFamily:
                        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    paddingBottom: "40px",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                }}
            >
                <style>{`
                    .da-container { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding-bottom: 40px; width: 100%; min-width: 0; }
                    .da-grid-2-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; width: 100%; }

                    /* ===== GRID KARTU STATISTIK ===== */
                    .stat-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
                        gap: 12px;
                        margin-bottom: 24px;
                        width: 100%;
                    }

                    /* ===== KARTU STATISTIK ===== */
                    .stat-card {
                        position: relative;
                        overflow: hidden;
                        border-radius: 14px;
                        padding: 14px 16px 16px;
                        cursor: pointer;
                        transition: transform 0.18s ease, box-shadow 0.18s ease;
                        animation: cardIn 0.45s ease-out backwards;
                    }
                    .stat-grid > .stat-card:nth-child(2) { animation-delay: 0.06s; }
                    .stat-grid > .stat-card:nth-child(3) { animation-delay: 0.12s; }
                    .stat-grid > .stat-card:nth-child(4) { animation-delay: 0.18s; }

                    .stat-card:hover {
                        transform: translateY(-4px) rotate(-0.6deg);
                        box-shadow: 0 12px 22px -10px rgba(15, 23, 42, 0.25);
                    }
                    .stat-card:active { transform: translateY(-1px) scale(0.995); }
                    .stat-card:focus-visible { outline: 2px solid #1e5b65; outline-offset: 2px; }

                    .stat-card__ghost {
                        position: absolute;
                        right: -18px;
                        bottom: -18px;
                        line-height: 0;
                        transition: transform 0.3s ease;
                        pointer-events: none;
                    }
                    .stat-card:hover .stat-card__ghost { transform: rotate(-8deg) scale(1.08); }

                    .stat-card__badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        padding: 3px 9px;
                        border-radius: 20px;
                        font-size: 11px;
                        font-weight: 700;
                        white-space: nowrap;
                    }

                    .stat-card__arrow {
                        opacity: 0;
                        transform: translateX(-4px);
                        transition: opacity 0.2s ease, transform 0.2s ease;
                        flex-shrink: 0;
                    }
                    .stat-card:hover .stat-card__arrow { opacity: 1; transform: none; }

                    .stat-card__label {
                        display: block;
                        margin-top: 12px;
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 0.4px;
                        text-transform: uppercase;
                        opacity: 0.85;
                    }
                    .stat-card__value {
                        font-size: 34px;
                        font-weight: 800;
                        line-height: 1.1;
                        letter-spacing: -1px;
                        font-variant-numeric: tabular-nums;
                    }
                    .stat-card__unit { font-size: 12px; font-weight: 600; }
                    .stat-card__track { height: 5px; border-radius: 3px; overflow: hidden; margin: 10px 0 2px; }
                    .stat-card__bar { height: 100%; border-radius: 3px; transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1); }
                    .stat-card__desc { margin: 8px 0 0; font-size: 12px; line-height: 1.45; max-width: 82%; }

                    /* ===== TAB 2: PETA POTENSI ===== */
                    .pd-grid { display: grid; grid-template-columns: 1.7fr 1fr; gap: 16px; align-items: stretch; }
                    .pd-card { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; overflow: hidden; }
                    .pd-head { padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
                    .pd-title { font-size: 13px; font-weight: 600; color: #0f172a; display: flex; align-items: center; gap: 6px; }
                    .pd-map { height: 520px; width: 100%; position: relative; }
                    .pd-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; border: 1px solid #cbd5e1; background: #fff; font-size: 12px; font-weight: 600; color: #1e5b65; cursor: pointer; transition: background .2s; }
                    .pd-btn:hover { background: #f1f5f9; }
                    .pd-btn:disabled { opacity: .5; cursor: not-allowed; }
                    .pd-btn:focus-visible { outline: 2px solid #2b7a86; outline-offset: 2px; }
                    .pd-legend { position: absolute; left: 12px; bottom: 26px; z-index: 2; background: rgba(255,255,255,.92); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
                    .pd-legend-row { display: flex; align-items: center; gap: 7px; font-size: 11px; color: #475569; margin-top: 4px; }
                    .pd-swatch { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
                    .pd-panel { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
                    .pd-hint { display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 12px; color: #64748b; }
                    .pd-fallback { display: flex; align-items: center; justify-content: center; height: 100%; padding: 24px; text-align: center; font-size: 13px; color: #64748b; background: #f8fafc; }
                    .pd-row { display: flex; gap: 14px; padding: 16px; cursor: pointer; align-items: flex-start; transition: background .2s; }
                    .pd-row:hover { background: #f8fafc; }
                    .pd-row:focus-visible { outline: 2px solid #2b7a86; outline-offset: -2px; }
                    .maplibregl-ctrl-attrib { font-size: 10px; }

                    /* Baris tabel interaktif */
                    .interactive-row { transition: all 0.2s ease; cursor: pointer; }
                    .interactive-row:hover { background-color: #f8fafc; border-color: #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
                    .interactive-row:active { transform: scale(0.995); }

                    /* ===== GLASS HEADER + TABS ===== */
                    .da-glass-header {
                        position: relative;
                        margin-bottom: 24px;
                        border-radius: 16px;
                        background: rgba(255, 255, 255, 0.55);
                        -webkit-backdrop-filter: blur(16px) saturate(180%);
                        backdrop-filter: blur(16px) saturate(180%);
                        border: 1px solid rgba(255, 255, 255, 0.6);
                        box-shadow: 0 8px 32px rgba(30, 91, 101, 0.08),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.7);
                        overflow: hidden;
                        animation: slideUp 0.4s ease-out;
                    }
                    .da-glass-header::after {
                        content: "";
                        position: absolute;
                        top: -70px;
                        right: -50px;
                        width: 200px;
                        height: 200px;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(43,122,134,0.16) 0%, rgba(43,122,134,0) 70%);
                        pointer-events: none;
                    }
                    .da-glass-top { position: relative; padding: 16px 20px 14px; }
                    .da-glass-title {
                        font-size: 20px;
                        font-weight: 800;
                        letter-spacing: -0.4px;
                        margin: 0 0 2px 0;
                        color: #1e5b65;
                        background: linear-gradient(135deg, #2b7a86 0%, #1e5b65 100%);
                        -webkit-background-clip: text;
                        background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                    .da-glass-sub { margin: 0; font-size: 13px; color: #64748b; }
                    .da-glass-tabs {
                        position: relative;
                        display: flex;
                        gap: 4px;
                        padding: 8px 12px;
                        border-top: 1px solid rgba(226, 232, 240, 0.8);
                        background: rgba(248, 250, 252, 0.5);
                        overflow-x: auto;
                        white-space: nowrap;
                        scrollbar-width: none;
                        -webkit-overflow-scrolling: touch;
                    }
                    .da-glass-tabs::-webkit-scrollbar { display: none; }
                    .da-glass-tabs button:focus-visible { outline: 2px solid #2b7a86; outline-offset: 2px; }

                    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes cardIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
                    .da-tab-content { animation: fade 0.2s ease-in; width: 100%; }

                    @media (prefers-reduced-motion: reduce) {
                        .da-glass-header, .stat-card { animation: none; }
                        .stat-card, .stat-card__ghost, .stat-card__bar { transition: none; }
                        .stat-card:hover { transform: none; }
                    }

                    @media (max-width: 900px) {
                        .pd-grid { grid-template-columns: 1fr; }
                        .pd-map { height: 380px; }
                    }

                    @media (max-width: 640px) {
                        .da-glass-top { padding: 14px 16px 12px; }
                        .da-glass-title { font-size: 18px; }
                        .da-glass-sub { font-size: 12px; }
                        .stat-card__value { font-size: 30px; }
                    }

                    @media (max-width: 768px) {
                        .da-grid-2-cols { grid-template-columns: 1fr; }
                        .da-topbar { flex-direction: column; align-items: flex-end; }
                    }
                `}</style>

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
                            }}
                        >
                            <div style={{ color: "#1e5b65" }}>
                                <UserCircle2 size={24} />
                            </div>
                            <span
                                style={{
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#0f172a",
                                }}
                            >
                                Koperasi Desa Merah Putih
                            </span>
                            <ChevronDown size={16} color="#64748b" />
                        </div>

                        {isProfileOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "110%",
                                    right: 0,
                                    width: "200px",
                                    background: "#ffffff",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                    boxShadow:
                                        "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                    zIndex: 50,
                                    padding: "8px",
                                }}
                            >
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

                {/* HEADER + TABS DALAM SATU GLASS CARD */}
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

                {/* KONTEN TAB UTAMA */}
                <div className="tab-content">
                    {/* =========================================
                        TAB 1: ANALISIS USAHA
                        ========================================= */}
                    {activeTab === "q1" && (
                        <div style={{ width: "100%" }}>
                            <div className="stat-grid" key="stats-q1">
                                <StatWidget
                                    tone="panen"
                                    badge="Katalog"
                                    badgeIcon={<Boxes size={12} />}
                                    label="Total Produk"
                                    value={analisisUsaha.stats.produkDianalisis}
                                    unit="produk"
                                    icon={<Package size={82} strokeWidth={1} />}
                                    description="Produk aktif yang dipantau sistem."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Total Produk",
                                                value: analisisUsaha.stats
                                                    .produkDianalisis,
                                                desc: "Menampilkan semua entitas komoditas dan produk yang datanya sedang diolah oleh mesin analitik AI secara real-time.",
                                            },
                                        })
                                    }
                                />
                                <StatWidget
                                    tone="tumbuh"
                                    badge="Tren naik"
                                    badgeIcon={<TrendingUp size={12} />}
                                    label="Kinerja Optimal"
                                    value={
                                        analisisUsaha.stats.berpotensiOptimal
                                    }
                                    unit={`dari ${analisisUsaha.stats.produkDianalisis}`}
                                    progress={rasioOptimal}
                                    icon={<Wheat size={82} strokeWidth={1} />}
                                    description="Perputaran stok sehat, margin aman."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Kinerja Optimal",
                                                value: analisisUsaha.stats
                                                    .berpotensiOptimal,
                                                desc: "Jumlah produk yang menunjukkan tren suplai dan margin penjualan yang sangat baik tanpa indikasi penumpukan di gudang.",
                                            },
                                        })
                                    }
                                />
                                <StatWidget
                                    tone="awas"
                                    badge="Perlu aksi"
                                    badgeIcon={<TrendingDown size={12} />}
                                    label="Perlu Perhatian"
                                    value={analisisUsaha.stats.perluPerhatian}
                                    unit="produk"
                                    icon={
                                        <AlertTriangle
                                            size={82}
                                            strokeWidth={1}
                                        />
                                    }
                                    description="Stok menumpuk atau margin menipis."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Perlu Perhatian",
                                                value: analisisUsaha.stats
                                                    .perluPerhatian,
                                                desc: "Produk-produk ini memerlukan tindakan segera, baik berupa promosi atau pengolahan nilai tambah untuk mencegah kerugian.",
                                            },
                                        })
                                    }
                                />
                                <StatWidget
                                    tone="kora"
                                    badge="Kora Think"
                                    badgeIcon={<Sparkles size={12} />}
                                    label="Model Confidence"
                                    value={
                                        analisisUsaha.stats.confidenceRataRata
                                    }
                                    unit="%"
                                    progress={
                                        analisisUsaha.stats.confidenceRataRata
                                    }
                                    icon={
                                        <Sparkles size={82} strokeWidth={1} />
                                    }
                                    description="Akurasi prediksi model saat ini."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Model Confidence",
                                                value: `${analisisUsaha.stats.confidenceRataRata}%`,
                                                desc: "Persentase ini mengukur seberapa yakin sistem AI terhadap insight dan rekomendasi yang diberikan berdasarkan kelengkapan data historis yang ada.",
                                            },
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
                                    width: "100%",
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
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            color: "#0f172a",
                                        }}
                                    >
                                        Output Analisis Sistem
                                    </span>
                                    <AiTag />
                                </div>
                                <div
                                    style={{ overflowX: "auto", width: "100%" }}
                                >
                                    <div style={{ minWidth: "600px" }}>
                                        {analisisUsaha.insights.map(
                                            (row, i) => {
                                                const isOptimal =
                                                    row.status === "optimal";
                                                const rowStyle =
                                                    getTab1RowColors(i);

                                                return (
                                                    <div
                                                        key={i}
                                                        className="interactive-row"
                                                        onClick={() =>
                                                            setSelectedData({
                                                                type: "analisis",
                                                                data: row,
                                                            })
                                                        }
                                                        style={{
                                                            display: "grid",
                                                            gridTemplateColumns:
                                                                "1.5fr 3fr 1fr",
                                                            gap: "16px",
                                                            padding: "16px",
                                                            borderBottom:
                                                                i <
                                                                analisisUsaha
                                                                    .insights
                                                                    .length -
                                                                    1
                                                                    ? "1px solid #f1f5f9"
                                                                    : "none",
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "12px",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    padding:
                                                                        "10px",
                                                                    background:
                                                                        rowStyle.bg,
                                                                    borderRadius:
                                                                        "8px",
                                                                    color: rowStyle.color,
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                <Package
                                                                    size={18}
                                                                />
                                                            </div>
                                                            <div
                                                                style={{
                                                                    overflow:
                                                                        "hidden",
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        display:
                                                                            "block",
                                                                        fontSize:
                                                                            "14px",
                                                                        fontWeight:
                                                                            "600",
                                                                        color: "#0f172a",
                                                                        whiteSpace:
                                                                            "nowrap",
                                                                        textOverflow:
                                                                            "ellipsis",
                                                                        overflow:
                                                                            "hidden",
                                                                    }}
                                                                >
                                                                    {row.produk}
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        fontSize:
                                                                            "11px",
                                                                        color: isOptimal
                                                                            ? "#10b981"
                                                                            : "#f59e0b",
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: "4px",
                                                                        marginTop:
                                                                            "2px",
                                                                        fontWeight:
                                                                            "500",
                                                                    }}
                                                                >
                                                                    {isOptimal ? (
                                                                        <CheckCircle2
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <AlertTriangle
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                    )}{" "}
                                                                    {isOptimal
                                                                        ? "Optimal"
                                                                        : "Perhatian"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "13px",
                                                                color: "#475569",
                                                                lineHeight:
                                                                    "1.5",
                                                            }}
                                                        >
                                                            {row.catatan}
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "8px",
                                                                justifyContent:
                                                                    "flex-end",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: "60px",
                                                                    height: "4px",
                                                                    borderRadius:
                                                                        "2px",
                                                                    background:
                                                                        "#f1f5f9",
                                                                    overflow:
                                                                        "hidden",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        width: `${row.confidence}%`,
                                                                        height: "100%",
                                                                        background:
                                                                            rowStyle.color,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        "12px",
                                                                    color: "#64748b",
                                                                    fontVariantNumeric:
                                                                        "tabular-nums",
                                                                    fontWeight:
                                                                        "600",
                                                                }}
                                                            >
                                                                {row.confidence}
                                                                %
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =========================================
                        TAB 2: POTENSI DESA — peta globe + batang 3D
                        ========================================= */}
                    {activeTab === "q2" && (
                        <div style={{ width: "100%" }}>
                            <div className="stat-grid" key="stats-q2">
                                <StatWidget
                                    tone="tumbuh"
                                    badge="Terpetakan"
                                    badgeIcon={<MapPin size={12} />}
                                    label="Titik Terpetakan"
                                    value={petaPotensi.stats.desaTerpetakan}
                                    unit="desa"
                                    icon={<MapPin size={82} strokeWidth={1} />}
                                    description="Data desa sudah divalidasi sistem."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Titik Terpetakan",
                                                value: petaPotensi.stats
                                                    .desaTerpetakan,
                                                desc: "Menunjukkan jumlah desa yang telah melalui proses pemetaan dan validasi geospasial oleh sistem.",
                                            },
                                        })
                                    }
                                />
                                <StatWidget
                                    tone="panen"
                                    badge="Komoditas"
                                    badgeIcon={<Wheat size={12} />}
                                    label="Potensi Terdeteksi"
                                    value={
                                        petaPotensi.stats.potensiTeridentifikasi
                                    }
                                    unit="titik"
                                    icon={<Target size={82} strokeWidth={1} />}
                                    description="Komoditas unggulan yang ditemukan."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Potensi Terdeteksi",
                                                value: petaPotensi.stats
                                                    .potensiTeridentifikasi,
                                                desc: "Sistem menemukan titik-titik komoditas unggulan baru yang memiliki nilai keekonomisan tinggi di masa depan.",
                                            },
                                        })
                                    }
                                />
                                <StatWidget
                                    tone="kora"
                                    badge="Siap match"
                                    badgeIcon={<CheckCircle2 size={12} />}
                                    label="Kecocokan Tinggi"
                                    value={petaPotensi.stats.kecocokanTinggi}
                                    unit={`dari ${petaPotensi.stats.desaTerpetakan}`}
                                    progress={rasioKecocokan}
                                    icon={
                                        <CheckCircle2
                                            size={82}
                                            strokeWidth={1}
                                        />
                                    }
                                    description="Stabilitas suplai terbaik."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Kecocokan Tinggi",
                                                value: petaPotensi.stats
                                                    .kecocokanTinggi,
                                                desc: "Total titik desa yang memiliki stabilitas suplai sangat baik dan siap disambungkan dengan ekosistem buyer.",
                                            },
                                        })
                                    }
                                />
                            </div>

                            <TabPotensiDesa
                                desaList={petaPotensi.desaList}
                                wilayah="Koperasi Desa Merah Putih"
                            />
                        </div>
                    )}

                    {/* =========================================
                        TAB 3: BUYER & REKOMENDASI
                        ========================================= */}
                    {activeTab === "q3" && (
                        <div style={{ width: "100%" }}>
                            <div className="stat-grid" key="stats-q3">
                                <StatWidget
                                    tone="jaring"
                                    badge="Jaringan"
                                    badgeIcon={<Network size={12} />}
                                    label="Total Entitas Buyer"
                                    value={buyerHistory.stats.totalBuyer}
                                    unit="buyer"
                                    icon={<Users size={82} strokeWidth={1} />}
                                    description="Pembeli aktif di jaringan koperasi."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Total Entitas Buyer",
                                                value: buyerHistory.stats
                                                    .totalBuyer,
                                                desc: "Jumlah total buyer, distributor, atau mitra bisnis yang aktif terdaftar dan berpartisipasi dalam ekosistem ini.",
                                            },
                                        })
                                    }
                                />
                                <StatWidget
                                    tone="riwayat"
                                    badge="Riwayat"
                                    badgeIcon={<History size={12} />}
                                    label="Log Transaksi"
                                    value={buyerHistory.stats.transaksiTercatat}
                                    unit="transaksi"
                                    icon={
                                        <ShoppingBag
                                            size={82}
                                            strokeWidth={1}
                                        />
                                    }
                                    description="Pembelian sukses yang tercatat."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Log Transaksi",
                                                value: buyerHistory.stats
                                                    .transaksiTercatat,
                                                desc: "Seluruh riwayat transaksi sukses yang terekam secara historis dan digunakan sebagai data latih model AI.",
                                            },
                                        })
                                    }
                                />
                                <StatWidget
                                    tone="kora"
                                    badge="Kora Think"
                                    badgeIcon={<Sparkles size={12} />}
                                    label="Rekomendasi Matching"
                                    value={
                                        buyerHistory.stats.rekomendasiDihasilkan
                                    }
                                    unit="peluang"
                                    icon={
                                        <GitMerge size={82} strokeWidth={1} />
                                    }
                                    description="Suplai cocok dengan preferensi buyer."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Rekomendasi Matching",
                                                value: buyerHistory.stats
                                                    .rekomendasiDihasilkan,
                                                desc: "Output prediksi algoritma yang mencocokkan pola supply (Desa) dengan tingkat demand (Buyer) secara otomatis.",
                                            },
                                        })
                                    }
                                />
                            </div>

                            <div className="da-grid-2-cols">
                                <div
                                    style={{
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "8px",
                                        backgroundColor: "#ffffff",
                                        overflow: "hidden",
                                        width: "100%",
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
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                color: "#0f172a",
                                            }}
                                        >
                                            Log Pembelian Teratas
                                        </span>
                                    </div>
                                    <div>
                                        {buyerHistory.riwayat.map((b, i) => (
                                            <div
                                                key={i}
                                                className="interactive-row"
                                                onClick={() =>
                                                    setSelectedData({
                                                        type: "buyer",
                                                        data: b,
                                                    })
                                                }
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "14px",
                                                    padding: "16px",
                                                    borderBottom:
                                                        i <
                                                        buyerHistory.riwayat
                                                            .length -
                                                            1
                                                            ? "1px solid #f1f5f9"
                                                            : "none",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: "10px",
                                                        background: "#f3e8ff",
                                                        borderRadius: "8px",
                                                        color: "#9333ea",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <ShoppingBag size={20} />
                                                </div>
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <p
                                                        style={{
                                                            margin: "0 0 4px",
                                                            fontSize: "14px",
                                                            fontWeight: "600",
                                                            color: "#0f172a",
                                                            whiteSpace:
                                                                "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                        }}
                                                    >
                                                        {b.nama}
                                                    </p>
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: "13px",
                                                            color: "#475569",
                                                            lineHeight: "1.4",
                                                        }}
                                                    >
                                                        Pembeli rutin produk{" "}
                                                        <strong>
                                                            {b.produkDibeli}
                                                        </strong>
                                                        . Segmentasi pasar:{" "}
                                                        {b.kategoriPreferensi}.
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
                                                            display: "block",
                                                            fontSize: "15px",
                                                            fontWeight: "700",
                                                            color: "#9333ea",
                                                        }}
                                                    >
                                                        {b.frekuensi}x
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: "11px",
                                                            color: "#64748b",
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        Transaksi
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "8px",
                                        backgroundColor: "#ffffff",
                                        overflow: "hidden",
                                        width: "100%",
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
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                color: "#0f172a",
                                            }}
                                        >
                                            Smart Matching Kora Think
                                        </span>
                                        <AiTag />
                                    </div>
                                    <div>
                                        {buyerHistory.rekomendasi.map(
                                            (r, i) => (
                                                <div
                                                    key={i}
                                                    className="interactive-row"
                                                    onClick={() =>
                                                        setSelectedData({
                                                            type: "match",
                                                            data: r,
                                                        })
                                                    }
                                                    style={{
                                                        padding: "16px",
                                                        borderBottom:
                                                            i <
                                                            buyerHistory
                                                                .rekomendasi
                                                                .length -
                                                                1
                                                                ? "1px solid #f1f5f9"
                                                                : "none",
                                                        display: "flex",
                                                        gap: "14px",
                                                        alignItems:
                                                            "flex-start",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding: "10px",
                                                            background:
                                                                "#fce7f3",
                                                            borderRadius: "8px",
                                                            color: "#db2777",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <GitMerge size={20} />
                                                    </div>
                                                    <div
                                                        style={{ minWidth: 0 }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "6px",
                                                                marginBottom:
                                                                    "6px",
                                                                flexWrap:
                                                                    "wrap",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        "14px",
                                                                    fontWeight:
                                                                        "600",
                                                                    color: "#0f172a",
                                                                }}
                                                            >
                                                                {r.desa}
                                                            </span>
                                                            <ChevronRight
                                                                size={14}
                                                                color="#94a3b8"
                                                                style={{
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        "14px",
                                                                    fontWeight:
                                                                        "600",
                                                                    color: "#db2777",
                                                                }}
                                                            >
                                                                {r.buyer}
                                                            </span>
                                                        </div>
                                                        <p
                                                            style={{
                                                                fontSize:
                                                                    "13px",
                                                                color: "#475569",
                                                                margin: 0,
                                                                lineHeight:
                                                                    "1.5",
                                                            }}
                                                        >
                                                            {r.alasan}
                                                        </p>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =========================================
                        TAB 4: NILAI TAMBAH
                        ========================================= */}
                    {activeTab === "q4" && (
                        <div style={{ width: "100%" }}>
                            <div className="stat-grid" key="stats-q4">
                                <StatWidget
                                    tone="panen"
                                    badge="Terindeks"
                                    badgeIcon={<Boxes size={12} />}
                                    label="Katalog Analisis"
                                    value={nilaiTambah.stats.produkDianalisis}
                                    unit="komoditas"
                                    icon={
                                        <PackagePlus
                                            size={82}
                                            strokeWidth={1}
                                        />
                                    }
                                    description="Produk mentah yang dievaluasi sistem."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Katalog Analisis",
                                                value: nilaiTambah.stats
                                                    .produkDianalisis,
                                                desc: "Banyaknya komoditas dasar yang diindeks sistem untuk menemukan skenario peningkatan nilai ekonomis.",
                                            },
                                        })
                                    }
                                />
                                <StatWidget
                                    tone="awas"
                                    badge="Tren naik"
                                    badgeIcon={<TrendingUp size={12} />}
                                    label="Potensi Kenaikan"
                                    value={nilaiTambah.stats.potensiPeningkatan}
                                    icon={
                                        <TrendingUp size={82} strokeWidth={1} />
                                    }
                                    description="Estimasi lonjakan margin profit."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Potensi Kenaikan (Val)",
                                                value: nilaiTambah.stats
                                                    .potensiPeningkatan,
                                                desc: "Prediksi nilai rata-rata persentase peningkatan keuntungan jika produk dijual melalui pendekatan nilai tambah (olahan/kemasan).",
                                            },
                                        })
                                    }
                                />
                                <StatWidget
                                    tone="kora"
                                    badge="Siap jalan"
                                    badgeIcon={<Rocket size={12} />}
                                    label="Aksi Tereksekusi"
                                    value={
                                        nilaiTambah.stats
                                            .rekomendasiSiapEksekusi
                                    }
                                    unit="rekomendasi"
                                    icon={<Rocket size={82} strokeWidth={1} />}
                                    description="Layak diimplementasi hari ini."
                                    onClick={() =>
                                        setSelectedData({
                                            type: "stat",
                                            data: {
                                                title: "Aksi Tereksekusi",
                                                value: nilaiTambah.stats
                                                    .rekomendasiSiapEksekusi,
                                                desc: "Rekomendasi taktis yang dinilai sistem memiliki probabilitas keberhasilan paling tinggi untuk dieksekusi hari ini.",
                                            },
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
                                    width: "100%",
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
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            color: "#0f172a",
                                        }}
                                    >
                                        Rekomendasi Skalabilitas
                                    </span>
                                    <AiTag />
                                </div>
                                <div
                                    style={{ overflowX: "auto", width: "100%" }}
                                >
                                    <div style={{ minWidth: "500px" }}>
                                        {nilaiTambah.rekomendasi.map((r, i) => (
                                            <div
                                                key={i}
                                                className="interactive-row"
                                                onClick={() =>
                                                    setSelectedData({
                                                        type: "nilai_tambah",
                                                        data: r,
                                                    })
                                                }
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        "1.5fr 3fr 2fr",
                                                    gap: "16px",
                                                    padding: "16px",
                                                    borderBottom:
                                                        i <
                                                        nilaiTambah.rekomendasi
                                                            .length -
                                                            1
                                                            ? "1px solid #f1f5f9"
                                                            : "none",
                                                    alignItems: "start",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "12px",
                                                        alignItems:
                                                            "flex-start",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding: "10px",
                                                            background:
                                                                "#e0f2fe",
                                                            borderRadius: "8px",
                                                            color: "#0ea5e9",
                                                            height: "fit-content",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <Lightbulb size={20} />
                                                    </div>
                                                    <div
                                                        style={{ minWidth: 0 }}
                                                    >
                                                        <h3
                                                            style={{
                                                                margin: "0 0 6px 0",
                                                                fontSize:
                                                                    "14px",
                                                                fontWeight:
                                                                    "600",
                                                                color: "#0f172a",
                                                                whiteSpace:
                                                                    "nowrap",
                                                                overflow:
                                                                    "hidden",
                                                                textOverflow:
                                                                    "ellipsis",
                                                            }}
                                                        >
                                                            {r.produk}
                                                        </h3>
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "4px",
                                                                fontSize:
                                                                    "11px",
                                                                fontWeight:
                                                                    "600",
                                                                color: "#10b981",
                                                                background:
                                                                    "#ecfdf5",
                                                                padding:
                                                                    "2px 6px",
                                                                borderRadius:
                                                                    "4px",
                                                            }}
                                                        >
                                                            <TrendingUp
                                                                size={10}
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />{" "}
                                                            {r.dampakEstimasi}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p
                                                    style={{
                                                        fontSize: "13px",
                                                        color: "#475569",
                                                        margin: 0,
                                                        lineHeight: "1.5",
                                                    }}
                                                >
                                                    {r.insightGabungan} Potensi
                                                    peningkatan margin cukup
                                                    signifikan jika rekomendasi
                                                    ini diterapkan.
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
                                                            display: "block",
                                                            fontSize: "10px",
                                                            fontWeight: "600",
                                                            color: "#64748b",
                                                            textTransform:
                                                                "uppercase",
                                                            marginBottom: "4px",
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
                                                            alignItems:
                                                                "flex-start",
                                                            lineHeight: "1.4",
                                                        }}
                                                    >
                                                        <ArrowUpRight
                                                            size={14}
                                                            color="#0ea5e9"
                                                            style={{
                                                                flexShrink: 0,
                                                                marginTop:
                                                                    "2px",
                                                            }}
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
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
