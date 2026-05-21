import {createServerClient} from '@supabase/ssr';
import {NextResponse, type NextRequest} from 'next/server';

/**
 * Updates the user's session by refreshing the auth token.
 * This function is called by the proxy on every request.
 *
 * @param request - The incoming Next.js request
 * @returns NextResponse with updated session cookies
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // Set cookies on the request for Server Components
                    cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value));

                    // Create new response with updated request
                    supabaseResponse = NextResponse.next({
                        request,
                    });

                    // Set cookies on the response with proper options
                    cookiesToSet.forEach(({name, value, options}) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh the session - this validates the JWT and updates cookies if needed
    // Use getUser() instead of getClaims() for better compatibility
    const {
        data: {user},
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Public routes that don't require authentication
    // Use exact match for root and startsWith for paths that have sub-routes
    const publicRoutes = ['/auth', '/api', '/marketplace', '/dashboard'];
    const publicExactRoutes = ['/', '/login'];

    const isPublicRoute =
        publicExactRoutes.includes(pathname) ||
        publicRoutes.some((route) => pathname.startsWith(route)) ||
        pathname.startsWith('/features');

    // Redirect logged-in users away from login page to dashboard
    if (user && pathname === '/login') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        const redirectResponse = NextResponse.redirect(url);

        supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });

        return redirectResponse;
    }

    // Redirect unauthenticated users to login for protected routes
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        const redirectResponse = NextResponse.redirect(url);

        supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });

        return redirectResponse;
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse;
}
