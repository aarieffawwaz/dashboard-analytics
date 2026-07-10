import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export const TONES = {
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

export type ToneKey = keyof typeof TONES;

export function useCountUp(target: number, duration = 900) {
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

export function StatWidget({
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
}: any) {
    const t = TONES[tone as ToneKey];
    const isNumeric = typeof value === "number";
    const counted = useCountUp(isNumeric ? value : 0);

    return (
        <div
            className="stat-card"
            role="button"
            tabIndex={0}
            onClick={onClick}
            style={{ background: t.bg, border: `1px solid ${t.border}` }}
        >
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
