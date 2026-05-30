/**
 * Wraps any icon with a small sparkle overlay to signal AI-powered actions.
 * Use for AI actions inside non-AI routes (e.g. "AI Re-plan" button in itinerary/).
 * Do NOT use for features that ARE AI (use SparklesIcon directly there instead).
 */
export function AI({
    icon,
    sparkleSize = 10,
}: {
    icon: React.ReactNode
    sparkleSize?: number
}) {
    return (
        <span className="relative inline-flex items-center justify-center">
            {icon}
            <span
                className="absolute -top-1 -right-1 text-violet-500 leading-none select-none pointer-events-none"
                style={{ fontSize: sparkleSize }}
                aria-hidden="true"
            >
                ✦
            </span>
        </span>
    )
}
