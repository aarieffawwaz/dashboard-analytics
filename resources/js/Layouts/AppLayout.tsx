import { PropsWithChildren, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    LayoutDashboard,
    Menu,
    X,
    Home,
    FileText,
    User,
    Users,
    Coins,
    Info,
    Newspaper,
    Shield,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import Logo from "@/Components/Logo";

export default function AppLayout({ children }: PropsWithChildren) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const { url } = usePage();

    const menuItems = [
        { name: "Beranda", icon: Home, path: "/beranda" },
        {
            name: "Formulir Permohonan",
            icon: FileText,
            path: "/formulir-permohonan",
        },
        { name: "Anggota", icon: User, path: "/anggota" },
        { name: "Karyawan", icon: Users, path: "/karyawan" },
        { name: "Rapat Anggota Tahun (RAT)", icon: FileText, path: "/rat" },
        { name: "Simpanan", icon: Coins, path: "/simpanan" },
        { name: "Laporan Keuangan", icon: Info, path: "/laporan-keuangan" },
        { name: "Artikel Kopdes", icon: Newspaper, path: "/artikel" },
        { name: "Jaga Desa", icon: Shield, path: "/jaga-desa" },
        // Pastikan path ini sesuai dengan route di Laravel kamu agar tidak 404
        {
            name: "Dashboard Analytics",
            icon: LayoutDashboard,
            path: "/dashboard",
        },
    ];

    return (
        <div className={`app-shell ${isCollapsed ? "is-collapsed" : ""}`}>
            <style>{`
                .sidebar { 
                    transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); 
                    overflow-x: hidden; 
                }
                .sidebar.collapsed { width: 80px !important; }
                .sidebar.collapsed .hide-on-collapse { display: none !important; }
                .sidebar.collapsed .center-on-collapse { 
                    justify-content: center !important; 
                    padding-left: 0 !important; 
                    padding-right: 0 !important; 
                }
                
                .main-content {
                    transition: margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                
                @media (min-width: 961px) {
                    .app-shell.is-collapsed .main-content {
                        margin-left: 80px !important;
                        width: calc(100% - 80px) !important;
                    }
                    .app-shell:not(.is-collapsed) .main-content {
                        margin-left: var(--sidebar-width, 240px) !important;
                        width: calc(100% - var(--sidebar-width, 240px)) !important;
                    }
                }
                
                @media (max-width: 960px) {
                    .desktop-toggle-btn { display: none !important; }
                    .sidebar.collapsed { width: var(--sidebar-width, 240px) !important; }
                    .sidebar.collapsed .hide-on-collapse { display: block !important; }
                    .sidebar.collapsed .center-on-collapse {
                        justify-content: flex-start !important;
                        padding-left: 14px !important;
                        padding-right: 14px !important;
                    }
                }
            `}</style>

            <div
                className={`sidebar-overlay ${menuOpen ? "open" : ""}`}
                onClick={() => setMenuOpen(false)}
            ></div>

            <aside
                className={`sidebar ${menuOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}
                style={{
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    padding: 0,
                }}
            >
                <div
                    className="center-on-collapse"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        backgroundColor: "#ffffff",
                        minHeight: "78px",
                    }}
                >
                    <div
                        className="hide-on-collapse"
                        style={{ display: "flex", alignItems: "center" }}
                    >
                        <Logo height={46} />
                    </div>
                    <button
                        className="desktop-toggle-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#1e5b65",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px",
                        }}
                    >
                        {isCollapsed ? (
                            <PanelLeftOpen size={22} />
                        ) : (
                            <PanelLeftClose size={22} />
                        )}
                    </button>
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="mobile-menu-btn hide-on-collapse"
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#1e5b65",
                            margin: 0,
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div
                    style={{
                        background:
                            "linear-gradient(180deg, #2b7a86 0%, #1e5b65 100%)",
                        flex: 1,
                        borderTopLeftRadius: "16px",
                        borderTopRightRadius: "16px",
                        paddingTop: "16px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        overflowY: "auto",
                        overflowX: "hidden",
                    }}
                >
                    <nav
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            paddingBottom: "20px",
                        }}
                    >
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = url
                                ? url.startsWith(item.path) ||
                                  (item.path === "/dashboard" && url === "/")
                                : false;

                            return (
                                <Link
                                    key={index}
                                    href={item.path}
                                    title={isCollapsed ? item.name : undefined}
                                    className="center-on-collapse"
                                    onClick={() => setMenuOpen(false)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "12px 24px",
                                        textDecoration: "none",
                                        fontSize: "14px",
                                        fontWeight: isActive ? "600" : "400",
                                        backgroundColor: isActive
                                            ? "#ffffff"
                                            : "transparent",
                                        color: isActive ? "#1e5b65" : "#ffffff",
                                        borderLeft: isActive
                                            ? "4px solid #d4af37"
                                            : "4px solid transparent",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <Icon
                                        size={18}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        style={{ flexShrink: 0 }}
                                    />
                                    <span className="hide-on-collapse">
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            <main className="main-content">
                <button
                    onClick={() => setMenuOpen(true)}
                    className="mobile-menu-btn"
                    aria-label="Buka menu"
                >
                    <Menu size={20} />
                </button>
                {children}
            </main>
        </div>
    );
}
