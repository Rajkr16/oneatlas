import { Suspense } from "react";
import type { Metadata } from "next";
import ModelsExplorer from "@/components/ModelsExplorer";
import { PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Models" };

export default function ModelsPage() {
  return (
    <>
      <PageHeading title="Models" sub="Search and filter every model. Filters live in the URL, so you can share any view." />
      <Suspense fallback={null}>
        <ModelsExplorer />
      </Suspense>
    </>
  );
}
