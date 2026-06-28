// components/result-table.jsx
"use client";

import { XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils"; // or just classnames if you have a utility

// ----------------- Prediction badge with mismatch highlight -----------------
function PredictionBadge({ predicted, actual }) {
  const mismatch = predicted !== actual;
  return (
    <Badge
      variant="outline"
      className={cn(
        mismatch
          ? "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400"
          : predicted === 0
          ? "text-emerald-500 border-emerald-500/50"
          : "text-destructive border-destructive/50"
      )}
    >
      {mismatch && <XCircle className="h-3 w-3 mr-1 inline" />}
      {predicted === 0 ? "Benign (0)" : "Attack (1)"}
    </Badge>
  );
}

// ----------------- Main component -----------------
export default function ResultTable({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No results to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">ID</TableHead>
            <TableHead className="w-[120px]">From IP</TableHead>
            <TableHead className="w-[150px]">Endpoint</TableHead>
            <TableHead className="min-w-[250px] max-w-[400px]">Query</TableHead>
            <TableHead className="w-[120px]">LLM Pred</TableHead>
            <TableHead className="w-[120px]">WAF Pred</TableHead>
            <TableHead className="w-[120px]">Own Model Pred</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs">{row.id}</TableCell>
              <TableCell className="font-mono text-sm">{row.ip}</TableCell>
              <TableCell className="font-mono text-sm">{row.endpoint}</TableCell>
              <TableCell className="p-2">
                <div className="max-w-[400px] overflow-x-auto whitespace-nowrap font-mono text-sm">
                  {row.query}
                </div>
              </TableCell>
              <TableCell>
                <PredictionBadge predicted={row.llm_pred} actual={row.label} />
              </TableCell>
              <TableCell>
                <PredictionBadge predicted={row.waf_pred} actual={row.label} />
              </TableCell>
              <TableCell>
                <PredictionBadge predicted={row.own_pred} actual={row.label} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}