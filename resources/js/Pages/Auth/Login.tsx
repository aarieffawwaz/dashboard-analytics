import { useForm } from "@inertiajs/react";
import { FormEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { Search, Building2, Check, ChevronDown, MapPin } from "lucide-react";
import Logo from "@/Components/Logo";

type Koperasi = {
    ref: string;
    nama: string;
    wilayah: string;
};

export default function Login({ koperasiList }: { koperasiList: Koperasi[] }) {
    const { data, setData, post, processing, errors } = useForm({
        koperasi_ref: "",
    });

    const [kueri, setKueri] = useState("");
    const [buka, setBuka] = useState(false);
    const [sorot, setSorot] = useState(0);

    const wadahRef = useRef<HTMLDivElement>(null);
    const daftarRef = useRef<HTMLUListElement>(null);

    const brandColor = "#0a4752";

    const terpilih = useMemo(
        () => koperasiList.find((k) => k.ref === data.koperasi_ref) ?? null,
        [koperasiList, data.koperasi_ref],
    );

    // Pencarian sederhana: nama koperasi atau nama wilayahnya.
    const hasil = useMemo(() => {
        const q = kueri.trim().toLowerCase();
        if (!q) return koperasiList.slice(0, 50);
        return koperasiList
            .filter(
                (k) =>
                    k.nama.toLowerCase().includes(q) ||
                    k.wilayah.toLowerCase().includes(q),
            )
            .slice(0, 50);
    }, [kueri, koperasiList]);

    useEffect(() => setSorot(0), [kueri]);

    // Tutup dropdown kalau klik di luar.
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!wadahRef.current?.contains(e.target as Node)) setBuka(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    // Jaga item tersorot tetap terlihat saat navigasi pakai panah.
    useEffect(() => {
        daftarRef.current?.children[sorot]?.scrollIntoView({
            block: "nearest",
        });
    }, [sorot]);

    const pilih = (k: Koperasi) => {
        setData("koperasi_ref", k.ref);
        setKueri("");
        setBuka(false);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setBuka(true);
            setSorot((s) => Math.min(s + 1, hasil.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSorot((s) => Math.max(s - 1, 0));
        } else if (e.key === "Enter" && buka && hasil[sorot]) {
            e.preventDefault();
            pilih(hasil[sorot]);
        } else if (e.key === "Escape") {
            setBuka(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post("/login");
    };

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                width: "100%",
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            {/* ================= PANEL KIRI (BRAND) ================= */}
            <div
                style={{
                    flex: 1,
                    backgroundColor: brandColor,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        bottom: "-20%",
                        left: "-10%",
                        width: "80%",
                        paddingBottom: "80%",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        zIndex: 1,
                    }}
                ></div>
                <div
                    style={{
                        position: "absolute",
                        bottom: "-40%",
                        left: "-20%",
                        width: "100%",
                        paddingBottom: "100%",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        zIndex: 1,
                    }}
                ></div>

                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        filter: "brightness(0) invert(1)",
                    }}
                >
                    <Logo height={70} />
                </div>
            </div>

            {/* ================= PANEL KANAN (PILIH KOPERASI) ================= */}
            <div
                style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem",
                    position: "relative",
                }}
            >
                <div style={{ width: "100%", maxWidth: "440px" }}>
                    <h1
                        style={{
                            color: brandColor,
                            fontSize: "22px",
                            fontWeight: 600,
                            marginBottom: "8px",
                            lineHeight: 1.4,
                        }}
                    >
                        Pilih Koperasi Desa/Kelurahan
                        <br />
                        Merah Putih
                    </h1>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            lineHeight: 1.6,
                            marginBottom: "28px",
                        }}
                    >
                        Cari koperasi lewat namanya atau nama wilayahnya.
                        Dashboard, peta, dan potensi desa akan mengikuti
                        koperasi yang dipilih.
                    </p>

                    <form
                        onSubmit={submit}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                        }}
                    >
                        <div ref={wadahRef} style={{ position: "relative" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "13px",
                                    marginBottom: "8px",
                                    color: "#374151",
                                }}
                            >
                                <span style={{ color: "#ef4444" }}>*</span>{" "}
                                Koperasi
                            </label>

                            {/* Kotak input + hasil terpilih */}
                            <div
                                onClick={() => setBuka(true)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "12px 14px",
                                    borderRadius: "6px",
                                    border: `1px solid ${
                                        errors.koperasi_ref
                                            ? "#ef4444"
                                            : buka
                                              ? brandColor
                                              : "#d1d5db"
                                    }`,
                                    background: "#ffffff",
                                    cursor: "text",
                                }}
                            >
                                <Search size={18} color="#9ca3af" />
                                <input
                                    type="text"
                                    role="combobox"
                                    aria-expanded={buka}
                                    aria-controls="daftar-koperasi"
                                    autoComplete="off"
                                    value={
                                        buka ? kueri : (terpilih?.nama ?? kueri)
                                    }
                                    onChange={(e) => {
                                        setKueri(e.target.value);
                                        setBuka(true);
                                    }}
                                    onFocus={() => setBuka(true)}
                                    onKeyDown={onKeyDown}
                                    placeholder={
                                        terpilih
                                            ? terpilih.nama
                                            : "Ketik nama koperasi atau desa"
                                    }
                                    style={{
                                        flex: 1,
                                        border: "none",
                                        outline: "none",
                                        fontSize: "14px",
                                        color: "#111827",
                                        background: "transparent",
                                        minWidth: 0,
                                    }}
                                />
                                <ChevronDown
                                    size={18}
                                    color="#9ca3af"
                                    style={{
                                        transform: buka
                                            ? "rotate(180deg)"
                                            : "none",
                                        transition: "transform .15s",
                                        flexShrink: 0,
                                    }}
                                />
                            </div>

                            {terpilih && !buka && (
                                <p
                                    style={{
                                        margin: "6px 0 0",
                                        fontSize: "12px",
                                        color: "#6b7280",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                    }}
                                >
                                    <MapPin size={12} /> {terpilih.wilayah}
                                </p>
                            )}

                            {errors.koperasi_ref && (
                                <p
                                    style={{
                                        color: "#ef4444",
                                        fontSize: "12px",
                                        marginTop: "6px",
                                    }}
                                >
                                    {errors.koperasi_ref}
                                </p>
                            )}

                            {/* Dropdown hasil */}
                            {buka && (
                                <ul
                                    id="daftar-koperasi"
                                    ref={daftarRef}
                                    role="listbox"
                                    style={{
                                        position: "absolute",
                                        top: "calc(100% + 6px)",
                                        left: 0,
                                        right: 0,
                                        maxHeight: "260px",
                                        overflowY: "auto",
                                        background: "#ffffff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "8px",
                                        boxShadow:
                                            "0 12px 24px -8px rgba(0,0,0,0.15)",
                                        listStyle: "none",
                                        margin: 0,
                                        padding: "6px",
                                        zIndex: 30,
                                    }}
                                >
                                    {hasil.length === 0 && (
                                        <li
                                            style={{
                                                padding: "14px",
                                                fontSize: "13px",
                                                color: "#6b7280",
                                            }}
                                        >
                                            Tidak ada koperasi yang cocok dengan
                                            “{kueri}”. Coba nama desanya.
                                        </li>
                                    )}

                                    {hasil.map((k, i) => {
                                        const aktif = i === sorot;
                                        const dipilih =
                                            k.ref === data.koperasi_ref;
                                        return (
                                            <li
                                                key={k.ref}
                                                role="option"
                                                aria-selected={dipilih}
                                                onMouseEnter={() => setSorot(i)}
                                                onClick={() => pilih(k)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "10px",
                                                    padding: "10px 12px",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                    background: aktif
                                                        ? "#f1f5f9"
                                                        : "transparent",
                                                }}
                                            >
                                                <Building2
                                                    size={16}
                                                    color={brandColor}
                                                    style={{ flexShrink: 0 }}
                                                />
                                                <div
                                                    style={{
                                                        minWidth: 0,
                                                        flex: 1,
                                                    }}
                                                >
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: "13.5px",
                                                            fontWeight: 600,
                                                            color: "#0f172a",
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {k.nama}
                                                    </p>
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: "11.5px",
                                                            color: "#6b7280",
                                                        }}
                                                    >
                                                        {k.wilayah}
                                                    </p>
                                                </div>
                                                {dipilih && (
                                                    <Check
                                                        size={16}
                                                        color={brandColor}
                                                    />
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || !data.koperasi_ref}
                            style={{
                                width: "100%",
                                padding: "12px",
                                backgroundColor: data.koperasi_ref
                                    ? brandColor
                                    : "#cbd5e1",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: 500,
                                cursor:
                                    processing || !data.koperasi_ref
                                        ? "not-allowed"
                                        : "pointer",
                                marginTop: "4px",
                                transition: "background-color .2s",
                            }}
                        >
                            {processing ? "Membuka dashboard..." : "Masuk"}
                        </button>

                        <p
                            style={{
                                textAlign: "center",
                                fontSize: "12px",
                                color: "#9ca3af",
                                margin: 0,
                            }}
                        >
                            {koperasiList.length.toLocaleString("id-ID")}{" "}
                            koperasi tersedia di dataset.
                        </p>
                    </form>

                    <div
                        style={{
                            marginTop: "40px",
                            fontSize: "10px",
                            color: "#9ca3af",
                            lineHeight: 1.5,
                        }}
                    >
                        Mode prototipe: pemilihan koperasi belum memakai
                        autentikasi akun.
                    </div>
                </div>
            </div>
        </div>
    );
}
