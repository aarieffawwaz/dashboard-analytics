interface LogoProps {
    height?: number;
}

export default function Logo({ height = 30 }: LogoProps) {
    return (
        <img
            src="/images/simkopdes.png"
            alt="SIKORA"
            style={{
                height,
                width: "auto",
                display: "block",
                objectFit: "contain",
                borderRadius: 6,
            }}
        />
    );
}
