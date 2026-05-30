"use client";
import { useState } from "react";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TextInput, PasswordInput, Button, Divider, Anchor } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createClientClient } from "@/utils/supabase/client";
import { AuthBrandHeader } from "@/app/(auth)/AuthBrandHeader";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

const loginSchema = z.object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const form = useForm<LoginValues>({
        mode: "uncontrolled",
        initialValues: { email: "", password: "" },
        validate: zodResolver(loginSchema),
    });

    async function onSubmit(values: LoginValues) {
        setIsLoading(true);
        const supabase = createClientClient();
        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        });
        setIsLoading(false);
        if (error) {
            notifications.show({ title: "Sign in failed", message: error.message, color: "red" });
            return;
        }
        router.push("/");
    }

    async function handleGoogleSignIn() {
        setIsGoogleLoading(true);
        const supabase = createClientClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/callback` },
        });
        if (error) {
            setIsGoogleLoading(false);
            notifications.show({ title: "Google sign in failed", message: error.message, color: "red" });
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
            <AuthBrandHeader />

            {/* Card */}
            <div className="bg-card rounded-2xl shadow-2xl shadow-primary/8 border border-border/60 p-8">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
                    <p className="text-sm text-muted-foreground mt-1">Sign in to continue planning</p>
                </div>

                <form onSubmit={form.onSubmit(onSubmit)} className="space-y-4">
                    <TextInput
                        label="Email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        key={form.key("email")}
                        {...form.getInputProps("email")}
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        key={form.key("password")}
                        {...form.getInputProps("password")}
                    />
                    <Button type="submit" fullWidth size="lg" loading={isLoading} mt="xs">
                        {isLoading ? "Signing in…" : "Sign in"}
                    </Button>
                </form>

                <Divider label="or continue with" labelPosition="center" my="lg" />

                <Button
                    variant="outline"
                    fullWidth
                    size="lg"
                    loading={isGoogleLoading}
                    onClick={handleGoogleSignIn}
                    leftSection={!isGoogleLoading ? <GoogleIcon /> : undefined}
                >
                    {isGoogleLoading ? "Connecting…" : "Continue with Google"}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Don&apos;t have an account?{" "}
                    <Anchor component={Link} href="/signup" fw={500}>
                        Sign up
                    </Anchor>
                </p>
            </div>
        </motion.div>
    );
}
