import { Suspense } from "react";
import type { Metadata } from "next";
import RankingsView from "@/components/RankingsView";
import { PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Rankings" };

export default function RankingsPage() {
  return (
    <>
      <PageHeading title="Rankings" sub="Leaderboards by benchmark. Switch category to see how models do on coding, maths, vision and more." />
      <Suspense fallback={null}>
        <RankingsView />
      </Suspense>
    </>
  );
}
