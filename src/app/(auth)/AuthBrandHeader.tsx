"use client";
import { MapPin as MapPinIcon } from "@phosphor-icons/react";

export function AuthBrandHeader() {
    return (
        <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                    style={{ background: "linear-gradient(135deg, #228BE6 0%, #7048E8 100%)" }}
                >
                    <MapPinIcon size={20} weight="fill" color="white" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-foreground">ECSATrail</span>
            </div>
            <p className="text-sm text-muted-foreground tracking-wide">Discover Vietnam, your way</p>
        </div>
    );
}
