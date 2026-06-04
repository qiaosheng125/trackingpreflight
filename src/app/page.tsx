import type { Metadata } from "next";
import TrackingPreflightApp from "./TrackingPreflightApp";

export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  }
};

export default function HomePage() {
  return <TrackingPreflightApp />;
}
