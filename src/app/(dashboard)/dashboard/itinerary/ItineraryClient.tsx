'use client'

import React from 'react'
import {useRouter, useSearchParams} from "next/navigation";
import {MOCK_PLANS} from "@/lib/mock-data";
import {PlannerLayout} from "@/components/sections/itinerary/PlannerLayout";
import { motion } from "framer-motion";

function ItineraryClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = searchParams.get('planId');
    const activePlan = planId ? (MOCK_PLANS.find(p => p.id === planId) ?? null) : null;

    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.22, ease: 'easeOut'}}
            className="h-full"
        >
            <PlannerLayout
                activePlan={activePlan}
                onClearActivePlan={() => router.push('/marketplace')}
            />
        </motion.div>
    )
}

export default ItineraryClient
