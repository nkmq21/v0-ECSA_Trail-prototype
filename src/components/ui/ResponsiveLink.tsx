import Link from 'next/link'
import type { Ref } from 'react'

export function ResponsiveLink({
    href,
    ref,
    children,
    ...props
}: {
    href: string
    ref?: Ref<HTMLAnchorElement>
    children: React.ReactNode
    [key: string]: unknown
}) {
    return (
        <Link href={href} ref={ref} {...(props as object)}>
            {children}
        </Link>
    )
}
