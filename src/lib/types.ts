export type ModelType = "TEXT" | "MULTIMODAL" | "IMAGE";

export type ModelListItem = {
  id: string;
  slug: string;
  name: string;
  type: ModelType;
  capabilities: string[];
  inputModalities: string[];
  outputModalities: string[];
  contextLength: number;
  inputPrice: number;
  outputPrice: number;
  isFree: boolean;
  releasedAt: string | Date;
  lab: { slug: string; name: string };
  _count: { providers: number };
};

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type FacetItem = { slug: string; name: string; _count: { models: number } };
export type Facets = {
  labs: FacetItem[];
  providers: FacetItem[];
  capabilities: { slug: string; count: number }[];
  types: { slug: string; name: string }[];
};

export type Benchmark = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  unit: string;
};

export type SearchResults = {
  models: { slug: string; name: string; lab: { name: string } }[];
  labs: { slug: string; name: string }[];
  providers: { slug: string; name: string }[];
};

export type RankingsResponse = {
  benchmark: Benchmark;
  benchmarks: Benchmark[];
  categories: string[];
  rows: {
    rank: number;
    score: number;
    model: {
      slug: string;
      name: string;
      inputPrice: number;
      outputPrice: number;
      contextLength: number;
      lab: { slug: string; name: string };
    };
  }[];
};

export type CompareModel = ModelListItem & {
  maxOutputTokens: number | null;
  scores: { benchmarkId: string; score: number; benchmark: Benchmark }[];
};
export type CompareResponse = { models: CompareModel[]; benchmarks: Benchmark[] };
