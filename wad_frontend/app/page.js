// app/page.jsx (or components/HomePage.jsx)
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Cpu,
  Globe,
  ShieldOff
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "LLM API",
    icon: Globe,
    description:
      "Test cutting‑edge large language models via API to evaluate their ability to identify SQL injection attempts in real‑time.",
    badge: "GPT‑class",
    href: "/llm-api",
  },
  {
    title: "Web Application Firewall",
    icon: ShieldOff,
    description:
      "Simulate a traditional WAF and measure how well rule‑based systems catch OWASP‑style SQLi payloads.",
    badge: "Signature",
    href: "/waf",
  },
  {
    title: "Transformer Fine‑tune",
    icon: Cpu,
    description:
      "Run a custom fine‑tuned transformer model trained specifically on SQLi datasets to benchmark precision and recall.",
    badge: "AI Model",
    href: "/transformer",
  },
];

const stats = [
  { label: "Detection Methods", value: "3" },
  { label: "Test Cases", value: "10k+" },
  { label: "Real‑time", value: "Yes" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="container px-4 py-24 md:py-32 mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            SQL Injection Detection Benchmark
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
            Compare{" "}
            <span className="text-primary">LLMs, WAFs &amp; Transformers</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            A hands‑on playground to evaluate how different technologies
            detect SQL injection attacks. From rule‑based firewalls to
            state‑of‑the‑art fine‑tuned transformers and API‑powered LLMs.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/sqlitest">
                Start Testing 
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard">Learn More</Link>
            </Button>
          </div>

          {/* Simple Stats Bar */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features / Comparison Cards */}
      <section className="container px-4 py-20 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Three engines, one mission
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Choose a detection method and see how it performs against
            classic and advanced SQL injection payloads.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map(({ title, icon: Icon, description, badge, href }) => (
            <Card
              key={title}
              className="group relative flex flex-col transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline">{badge}</Badge>
                </div>
                <CardTitle className="mt-4">{title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <Button variant="ghost" className="w-full justify-between" asChild>
                  <Link href={href}>
                    Explore {title}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t">
        <div className="container px-4 py-16 text-center mx-auto">
          <h2 className="text-2xl font-bold">
            Ready to benchmark your own payloads?
          </h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            Jump into the interactive test environment and compare
            detection results side by side.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/sqlitest">
              Open SQLi Test 
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}