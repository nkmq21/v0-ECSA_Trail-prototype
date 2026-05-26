"use client";

import {createContext, useContext, useEffect, useState} from "react";
import {User} from "@supabase/supabase-js";
import {createClientClient} from "@/utils/supabase/client";

interface UserProfile {
    id: string;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
    province: string | null;
    verified: boolean;
    joinedAt: string;
    pointsBalance: number;
    level: number;
}

type UserContextValue = {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const supabase = createClientClient();

        async function loadProfile(userId: string): Promise<UserProfile | null> {
            const [{data: profileData}, {data: progressData}] =
                await Promise.all([
                    supabase.from("profile").select("*").eq("id", userId).maybeSingle(),
                    supabase
                        .from("user_progress")
                        .select("points_balance, level")
                        .eq("user_id", userId)
                        .maybeSingle(),
                ]);

            if (!profileData) return null;

            return {
                id: profileData.id,
                name: profileData.name ?? "Traveler",
                avatarUrl: profileData.avatar_url ?? null,
                bio: profileData.bio ?? null,
                province: profileData.province ?? null,
                verified: profileData.verified ?? false,
                joinedAt: profileData.joined_at
                    ? new Date(profileData.joined_at).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                    })
                    : "Unknown",
                pointsBalance: progressData?.points_balance ?? 0,
                level: progressData?.level ?? 1,
            };
        }

        supabase.auth.getUser().then(({data: {user}}) => {
            setUser(user);
            if (user) {
                loadProfile(user.id).then((p) => {
                    setProfile(p);
                    setIsLoading(false);
                });
            } else {
                setIsLoading(false);
            }
        });

        const {
            data: {subscription},
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                loadProfile(currentUser.id).then((p) => {
                    setProfile(p);
                    setIsLoading(false);
                });
            } else {
                setProfile(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{user, profile, isLoading}}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used within UserProvider");
    return ctx;
}
