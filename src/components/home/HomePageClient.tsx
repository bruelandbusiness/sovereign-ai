"use client";

import { useState } from "react";
import { BookingModal } from "@/components/home/BookingModal";
import { VideoModal } from "@/components/shared/VideoModal";
import { trackEvent } from "@/lib/tracking";
import { trackDemoVideoPlayed } from "@/lib/analytics";

interface HomePageClientProps {
  demoVideoId?: string;
  children: (props: {
    openBooking: () => void;
    openVideo: () => void;
    bookingOpen: boolean;
    setBookingOpen: (open: boolean) => void;
  }) => React.ReactNode;
}

export function HomePageClient({ demoVideoId, children }: HomePageClientProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const openBooking = () => {
    trackEvent("cta_click", { source: "homepage", page: "/", cta_type: "booking" });
    setBookingOpen(true);
  };
  const openVideo = () => {
    trackEvent("cta_click", { source: "homepage", page: "/", cta_type: "video" });
    trackDemoVideoPlayed();
    setVideoOpen(true);
  };

  return (
    <>
      {children({ openBooking, openVideo, bookingOpen, setBookingOpen })}
      <BookingModal open={bookingOpen} onOpenChange={setBookingOpen} />
      {demoVideoId && (
        <VideoModal open={videoOpen} onOpenChange={setVideoOpen} videoId={demoVideoId} />
      )}
    </>
  );
}
