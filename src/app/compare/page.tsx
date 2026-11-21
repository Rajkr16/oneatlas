import { Suspense } from "react";
import type { Metadata } from "next";
import CompareView from "@/components/CompareView";
import { PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Compare models" };

export default function ComparePage() {
  return (
    <>
      <PageHeading title="Compare models" sub="Pick up to four models. The best value in each row is highlighted." />
      <Suspense fallback={null}>
        <CompareView />
      </Suspense>
    </>
  );
}
