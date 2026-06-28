// app/not-found.jsx
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-extrabold tracking-tighter text-primary/60 md:text-9xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you’re looking for doesn’t exist or has been moved.
        Double‑check the URL or head back to the dashboard.
      </p>
      <Button asChild className="mt-8 gap-2">
        <Link href="/">
          Go to Home
        </Link>
      </Button>
    </div>
  );
}