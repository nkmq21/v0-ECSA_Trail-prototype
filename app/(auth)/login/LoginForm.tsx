'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPinIcon, Loader2Icon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { toast } from 'sonner'
import { createClientClient } from '@/utils/supabase/client'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const loginSchema = z.object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })

    async function onSubmit(values: LoginValues) {
        setIsLoading(true)
        const supabase = createClientClient()
        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        })
        setIsLoading(false)
        if (error) {
            toast.error(error.message)
            return
        }
        router.push('/dashboard/chat')
    }

    async function handleGoogleSignIn() {
        setIsGoogleLoading(true)
        const supabase = createClientClient()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/callback` },
        })
        if (error) {
            setIsGoogleLoading(false)
            toast.error(error.message)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Brand header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2.5 mb-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                        style={{ background: 'linear-gradient(135deg, #228BE6 0%, #7048E8 100%)' }}
                    >
                        <MapPinIcon className="size-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-foreground">ECSATrail</span>
                </div>
                <p className="text-sm text-muted-foreground tracking-wide">Discover Vietnam, your way</p>
            </div>

            {/* Card */}
            <div className="bg-card rounded-2xl shadow-2xl shadow-primary/8 border border-border/60 p-8">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
                    <p className="text-sm text-muted-foreground mt-1">Sign in to continue planning</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <span className="text-xs text-muted-foreground">
                                            Min. 6 characters
                                        </span>
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                autoComplete="current-password"
                                                className="pr-10"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                tabIndex={-1}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword
                                                    ? <EyeOffIcon className="size-4" />
                                                    : <EyeIcon className="size-4" />
                                                }
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full mt-2"
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2Icon className="animate-spin" />}
                            {isLoading ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </form>
                </Form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-3 text-muted-foreground">or continue with</span>
                    </div>
                </div>

                {/* Google */}
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    size="lg"
                    disabled={isGoogleLoading}
                    onClick={handleGoogleSignIn}
                >
                    {isGoogleLoading
                        ? <Loader2Icon className="animate-spin" />
                        : <GoogleIcon />
                    }
                    {isGoogleLoading ? 'Connecting…' : 'Continue with Google'}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-primary font-medium hover:underline underline-offset-4">
                        Sign up
                    </Link>
                </p>
            </div>
        </motion.div>
    )
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}
