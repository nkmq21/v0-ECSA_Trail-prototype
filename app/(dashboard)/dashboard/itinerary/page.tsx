import {Suspense} from "react";
import ItineraryClient from "@/app/(dashboard)/dashboard/itinerary/ItineraryClient";

export default function ItineraryPage() {
    return (
        <Suspense fallback={null}>
            <ItineraryClient />
        </Suspense>
    )
}
