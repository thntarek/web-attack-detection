"use client";

import {
  CheckCircle2,
  Cpu,
  Filter,
  Globe,
  HelpCircle,
  Loader2,
  ShieldOff,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------- API configuration ----------
const API_URL = "http://localhost:8000/api/v1/data/evaluations";
const RECORDS_PER_PAGE = 100;

// ---------- Helper: compute metrics ----------
function computeMetrics(data, predKey) {
  let tp = 0,
    tn = 0,
    fp = 0,
    fn = 0;
  for (const row of data) {
    const actual = row.label;
    const pred = row[predKey] ?? 0; // treat null as benign for metrics
    if (actual === 1 && pred === 1) tp++;
    else if (actual === 1 && pred === 0) fn++;
    else if (actual === 0 && pred === 1) fp++;
    else if (actual === 0 && pred === 0) tn++;
  }
  const total = tp + tn + fp + fn;
  const accuracy = total ? (tp + tn) / total : 0;
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 =
    precision + recall ? 2 * ((precision * recall) / (precision + recall)) : 0;
  return {
    tp,
    tn,
    fp,
    fn,
    accuracy,
    precision,
    recall,
    f1,
    correct: tp + tn,
    incorrect: fp + fn,
  };
}

// ---------- Prediction badge with null handling ----------
function PredictionBadge({ predicted, actual }) {
  if (predicted === null || predicted === undefined) {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground border-muted/50"
      >
        <HelpCircle className="h-3 w-3 mr-1 inline" />
        N/A
      </Badge>
    );
  }
  const mismatch = predicted !== actual;
  return (
    <Badge
      variant="outline"
      className={
        mismatch
          ? "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400"
          : predicted === 0
            ? "text-emerald-500 border-emerald-500/50"
            : "text-destructive border-destructive/50"
      }
    >
      {mismatch && <XCircle className="h-3 w-3 mr-1 inline" />}
      {predicted === 0 ? "Benign (0)" : "Attack (1)"}
    </Badge>
  );
}

// ---------- Sub-components (unchanged) ----------
function ModelCard({ title, icon: Icon, metrics }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>Confusion Matrix &amp; Report</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Confusion Matrix
          </p>
          <div className="grid grid-cols-2 gap-px bg-border rounded-md overflow-hidden text-center text-sm">
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-2">
              TN: {metrics.tn}
            </div>
            <div className="bg-red-500/10 dark:bg-red-500/20 p-2">
              FP: {metrics.fp}
            </div>
            <div className="bg-red-500/10 dark:bg-red-500/20 p-2">
              FN: {metrics.fn}
            </div>
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-2">
              TP: {metrics.tp}
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Actual ↓ / Predicted →</span>
            <span>Benign / Attack</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Classification Report
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">Accuracy</span>
            <span className="font-mono">
              {(metrics.accuracy * 100).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">Precision</span>
            <span className="font-mono">{metrics.precision.toFixed(2)}</span>
            <span className="text-muted-foreground">Recall</span>
            <span className="font-mono">{metrics.recall.toFixed(2)}</span>
            <span className="text-muted-foreground">F1 Score</span>
            <span className="font-mono">{metrics.f1.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryTable({ metrics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prediction Summary</CardTitle>
        <CardDescription>
          Total correct and incorrect predictions per model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead className="text-emerald-500">Correct</TableHead>
              <TableHead className="text-destructive">Incorrect</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { name: "LLM API", data: metrics.llm },
              { name: "WAF", data: metrics.waf },
              { name: "Own Model", data: metrics.own },
            ].map((model) => (
              <TableRow key={model.name}>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                    {model.data.correct}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-4 w-4" />
                    {model.data.incorrect}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FilterBar({ filters, setFilters, filteredCount, totalCount }) {
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <CardTitle className="text-base flex items-center gap-2">
            Filter Records
            <Badge variant="secondary" className="text-xs font-normal">
              {filteredCount}
            </Badge>
          </CardTitle>
        </div>
        <CardDescription>
          Showing {filteredCount} of {totalCount} records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Original Label</label>
            <Select
              value={filters.original}
              onValueChange={(v) => handleFilterChange("original", v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">Attack (1)</SelectItem>
                <SelectItem value="0">Benign (0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">LLM Prediction</label>
            <Select
              value={filters.llm}
              onValueChange={(v) => handleFilterChange("llm", v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">Attack (1)</SelectItem>
                <SelectItem value="0">Benign (0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">WAF Prediction</label>
            <Select
              value={filters.waf}
              onValueChange={(v) => handleFilterChange("waf", v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">Attack (1)</SelectItem>
                <SelectItem value="0">Benign (0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Own Model</label>
            <Select
              value={filters.own}
              onValueChange={(v) => handleFilterChange("own", v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">Attack (1)</SelectItem>
                <SelectItem value="0">Benign (0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Main Dashboard Page ----------
export default function DashboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    original: "all",
    llm: "all",
    waf: "all",
    own: "all",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const mapped = json.map((item) => ({
          id: item.id,
          sql: item.payload,
          label: item.original_label,
          llm_pred: null,
          waf_pred: item.waf_pred ?? null,
          own_pred: item.ml_pred ?? null,
        }));
        setData(mapped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (filters.original !== "all" && row.label !== Number(filters.original))
        return false;
      if (filters.llm !== "all" && row.llm_pred !== Number(filters.llm))
        return false;
      if (filters.waf !== "all" && row.waf_pred !== Number(filters.waf))
        return false;
      if (filters.own !== "all" && row.own_pred !== Number(filters.own))
        return false;
      return true;
    });
  }, [data, filters]);

  const totalFiltered = filteredData.length;
  const totalFilteredPages = Math.ceil(totalFiltered / RECORDS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredData.slice(start, start + RECORDS_PER_PAGE);
  }, [filteredData, currentPage]);

  const metrics = useMemo(
    () => ({
      llm: computeMetrics(data, "llm_pred"),
      waf: computeMetrics(data, "waf_pred"),
      own: computeMetrics(data, "own_pred"),
    }),
    [data],
  );

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    if (totalFilteredPages <= maxVisible + 2) {
      for (let i = 1; i <= totalFilteredPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis-start");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalFilteredPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalFilteredPages - 2) pages.push("ellipsis-end");
      pages.push(totalFilteredPages);
    }
    return pages;
  }, [currentPage, totalFilteredPages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-destructive">
          <h2 className="text-lg font-semibold">Failed to load data</h2>
          <p className="mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Detection Results Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Compare performance of LLM API, WAF, and fine‑tuned model on{" "}
          {data.length.toLocaleString()} SQL queries.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <ModelCard title="LLM API" icon={Globe} metrics={metrics.llm} />
        <ModelCard title="WAF" icon={ShieldOff} metrics={metrics.waf} />
        <ModelCard title="Own Model" icon={Cpu} metrics={metrics.own} />
      </div>

      <SummaryTable metrics={metrics} />

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        filteredCount={totalFiltered}
        totalCount={data.length}
      />

      <Card>
        <CardHeader>
          <CardTitle>Test Set Predictions</CardTitle>
          <CardDescription>
            Showing {paginatedData.length} of {totalFiltered} filtered records –
            Page {currentPage} of {totalFilteredPages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedData.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No records match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead className="min-w-[300px] max-w-[500px]">
                      SQL Query
                    </TableHead>
                    <TableHead className="w-[120px]">Original Label</TableHead>
                    <TableHead className="w-[120px]">LLM Prediction</TableHead>
                    <TableHead className="w-[120px]">WAF Prediction</TableHead>
                    <TableHead className="w-[120px]">Own Model</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">
                        {row.id}
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="max-w-[500px] overflow-x-auto whitespace-nowrap font-mono text-sm">
                          {row.sql}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            row.label === 0
                              ? "text-emerald-500 border-emerald-500/50"
                              : "text-destructive border-destructive/50"
                          }
                        >
                          {row.label === 0 ? "Benign (0)" : "Attack (1)"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <PredictionBadge
                          predicted={row.llm_pred}
                          actual={row.label}
                        />
                      </TableCell>
                      <TableCell>
                        <PredictionBadge
                          predicted={row.waf_pred}
                          actual={row.label}
                        />
                      </TableCell>
                      <TableCell>
                        <PredictionBadge
                          predicted={row.own_pred}
                          actual={row.label}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalFilteredPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              />
            </PaginationItem>
            {pageNumbers.map((page, idx) =>
              page === "ellipsis-start" || page === "ellipsis-end" ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, totalFilteredPages),
                  )
                }
                disabled={currentPage === totalFilteredPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
