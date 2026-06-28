"use client";

import { AlertTriangle, HelpCircle, Play, Trash2, XCircle } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------- Prediction badge (unchanged) ----------------
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

// ---------------- API configuration ----------------
const API_URL = "http://localhost:8000/instanttest/predict";

// ---------------- Main page ----------------
export default function TestSQLiPage() {
  const [sqlQuery, setSqlQuery] = useState("");
  const [isAttack, setIsAttack] = useState(false);
  const [tests, setTests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sqlQuery.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: sqlQuery,
          original_label: isAttack ? 1 : 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Map API response to UI fields
      const newTest = {
        id: Date.now(),
        payload: sqlQuery,
        label: isAttack ? 1 : 0,
        llm_pred: null, // No LLM prediction available
        waf_pred: data.waf_prediction ?? null,
        own_pred: data.ml_prediction ?? null,
      };

      setTests((prev) => [newTest, ...prev]); // newest first
      setSqlQuery("");
      setIsAttack(false);
    } catch (err) {
      setError(err.message);
      // Optionally show an error toast – but we keep UI minimal
      console.error("Prediction failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearHistory = () => setTests([]);

  return (
    <div className="container px-4 py-8 mx-auto space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Instant Detection Test
        </h1>
        <p className="text-muted-foreground mt-1">
          Submit a attack payload and instantly see predictions from LLM, WAF,
          and own fine‑tuned model.
        </p>
      </div>

      {/* Input form */}
      <Card>
        <CardHeader>
          <CardTitle>New Test Payload</CardTitle>
          <CardDescription>Enter a payload</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="payload">Payload</Label>
              <Textarea
                id="payload"
                placeholder="SELECT * FROM users WHERE id = 1 OR 1=1"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={3}
                className="font-mono"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="attack-toggle"
                  checked={isAttack}
                  onCheckedChange={setIsAttack}
                />
                <Label htmlFor="attack-toggle" className="cursor-pointer">
                  This is an{" "}
                  <span className="text-destructive font-medium">Attack</span>{" "}
                  payload
                </Label>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    Specify the ground‑truth label to see prediction mismatches.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                Error: {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" className="gap-2" disabled={isSubmitting}>
              <Play className="h-4 w-4" />
              {isSubmitting ? "Predicting..." : "Payload"}
            </Button>
            {tests.length > 0 && (
              <Button
                variant="outline"
                type="button"
                onClick={clearHistory}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear History
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Results / History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Test History</CardTitle>
            <CardDescription>
              {tests.length === 0
                ? "No tests run yet."
                : `${tests.length} test${tests.length > 1 ? "s" : ""} recorded`}
            </CardDescription>
          </div>
          {tests.length > 0 && (
            <Badge variant="secondary">{tests.length} records</Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {tests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Submit your first payload above to see results.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead className="min-w-[250px] max-w-[400px]">
                      Payload
                    </TableHead>
                    <TableHead className="w-[100px]">Label</TableHead>
                    <TableHead className="w-[120px]">LLM</TableHead>
                    <TableHead className="w-[120px]">WAF</TableHead>
                    <TableHead className="w-[120px]">Own Model</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test, index) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-mono text-xs">
                        {tests.length - index}
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="max-w-[400px] overflow-x-auto whitespace-nowrap font-mono text-sm">
                          {test.sql}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            test.label === 0
                              ? "text-emerald-500 border-emerald-500/50"
                              : "text-destructive border-destructive/50"
                          }
                        >
                          {test.label === 0 ? "Benign (0)" : "Attack (1)"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <PredictionBadge
                          predicted={test.llm_pred}
                          actual={test.label}
                        />
                      </TableCell>
                      <TableCell>
                        <PredictionBadge
                          predicted={test.waf_pred}
                          actual={test.label}
                        />
                      </TableCell>
                      <TableCell>
                        <PredictionBadge
                          predicted={test.own_pred}
                          actual={test.label}
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
    </div>
  );
}
