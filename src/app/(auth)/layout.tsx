export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="min-h-screen w-full relative flex items-center justify-center overflow-hidden"
            style={{ background: 'var(--brand-bg)' }}
        >
            {/* Dot-grid background */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 1.5px 1.5px, rgba(34,139,230,0.10) 1.5px, transparent 0)',
                    backgroundSize: '30px 30px',
                }}
            />

            {/* Top-right blue orb */}
            <div
                className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(34,139,230,0.18) 0%, transparent 70%)',
                }}
            />

            {/* Bottom-left amber orb */}
            <div
                className="absolute -bottom-24 -left-24 w-[360px] h-[360px] rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(250,176,5,0.14) 0%, transparent 70%)',
                }}
            />

            {/* Thin top accent bar */}
            <div
                className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none"
                style={{ background: 'linear-gradient(90deg, #228BE6 0%, #7048E8 50%, #FAB005 100%)' }}
            />

            <div className="relative z-10 w-full max-w-[440px] px-4 py-12">
                {children}
            </div>
        </div>
    )
}
