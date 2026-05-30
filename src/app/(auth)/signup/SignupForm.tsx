"use client";
import { useState } from "react";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TextInput, PasswordInput, Button, Divider, Anchor, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { EnvelopeSimple as EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { createClientClient } from "@/utils/supabase/client";
import { AuthBrandHeader } from "@/app/(auth)/AuthBrandHeader";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

const signupSchema = z
    .object({
        fullName: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Enter a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type SignupValues = z.infer<typeof signupSchema>;

export function SignupForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [confirmedEmail, setConfirmedEmail] = useState("");

    const form = useForm<SignupValues>({
        mode: "uncontrolled",
        initialValues: { fullName: "", email: "", password: "", confirmPassword: "" },
        validate: zodResolver(signupSchema),
    });

    async function onSubmit(values: SignupValues) {
        setIsLoading(true);
        const supabase = createClientClient();
        const { error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: { data: { full_name: values.fullName } },
        });
        setIsLoading(false);
        if (error) {
            notifications.show({ title: "Sign up failed", message: error.message, color: "red" });
            return;
        }
        setConfirmedEmail(values.email);
        setConfirmed(true);
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
                <AnimatePresence mode="wait">
                    {confirmed ? (
                        <motion.div
                            key="confirmed"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <Alert
                                variant="light"
                                color="blue"
                                title="Check your inbox"
                                icon={<EnvelopeSimpleIcon size={18} weight="fill" />}
                            >
                                <p>
                                    We sent a confirmation link to{" "}
                                    <strong>{confirmedEmail}</strong>. Click it to activate your account.
                                </p>
                                <Anchor component={Link} href="/login" size="sm" fw={500} mt={8} display="block">
                                    Already confirmed? Sign in
                                </Anchor>
                            </Alert>
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="mb-6">
                                <h1 className="text-xl font-semibold text-foreground">Create account</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Start planning your Vietnam adventure
                                </p>
                            </div>

                            <form onSubmit={form.onSubmit(onSubmit)} className="space-y-4">
                                <TextInput
                                    label="Full name"
                                    placeholder="Alex Nguyen"
                                    autoComplete="name"
                                    key={form.key("fullName")}
                                    {...form.getInputProps("fullName")}
                                />
                                <TextInput
                                    label="Email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    key={form.key("email")}
                                    {...form.getInputProps("email")}
                                />
                                <PasswordInput
                                    label="Password"
                                    placeholder="Min. 8 characters"
                                    autoComplete="new-password"
                                    key={form.key("password")}
                                    {...form.getInputProps("password")}
                                />
                                <PasswordInput
                                    label="Confirm password"
                                    placeholder="Repeat your password"
                                    autoComplete="new-password"
                                    key={form.key("confirmPassword")}
                                    {...form.getInputProps("confirmPassword")}
                                />
                                <Button type="submit" fullWidth size="lg" loading={isLoading} mt="xs">
                                    {isLoading ? "Creating account…" : "Create account"}
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
                                Already have an account?{" "}
                                <Anchor component={Link} href="/login" fw={500}>
                                    Sign in
                                </Anchor>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
