// app/vulnerable-web/page.jsx
"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import ResultTable from "@/components/result-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const dummyResults = [
  {
    id: 1,
    ip: "192.168.1.10",
    endpoint: "/login",
    query: "SELECT * FROM users WHERE username = 'admin' AND password = '123'",
    label: 0,
    llm_pred: 0,
    waf_pred: 1,
    own_pred: 0,
  },
  {
    id: 2,
    ip: "10.0.0.5",
    endpoint: "/search",
    query: "SELECT * FROM products WHERE id = 1 OR 1=1",
    label: 1,
    llm_pred: 1,
    waf_pred: 1,
    own_pred: 1,
  },
  // ... more rows
];
// Dummy products
const products = [
  { id: 1, name: "Red Apple", product_type: "Fruit", price: "$1.20", img: "🍎", details: "Fresh, locally grown red apples." },
  { id: 2, name: "Banana Bunch", product_type: "Fruit", price: "$0.80", img: "🍌", details: "Organic bananas from Ecuador." },
  { id: 3, name: "Gaming Laptop", product_type: "Electronics", price: "$1,299", img: "💻", details: "15.6” display, RTX 4080." },
  { id: 4, name: "Wireless Headphones", product_type: "Electronics", price: "$199", img: "🎧", details: "Active noise cancelling, 30h battery." },
  { id: 5, name: "Smartphone X", product_type: "Electronics", price: "$899", img: "📱", details: "6.7” AMOLED, 108MP camera." },
  { id: 6, name: "Mystery Novel", product_type: "Book", price: "$14.99", img: "📚", details: "A gripping whodunit." },
  { id: 7, name: "Science Textbook", product_type: "Book", price: "$89.00", img: "📖", details: "University-level physics." },
  { id: 8, name: "Office Chair", product_type: "Furniture", price: "$249", img: "🪑", details: "Ergonomic mesh back, lumbar support." },
  { id: 9, name: "Desk Lamp", product_type: "Furniture", price: "$59", img: "💡", details: "LED desk lamp, USB charging." },
  { id: 10, name: "Yoga Mat", product_type: "Sports", price: "$29.99", img: "🧘", details: "Non-slip TPE, 6mm thick." },
];

export default function VulnerableWebPage() {
  // --- Login form state ---
  const [activeFields, setActiveFields] = useState({
    username: false,
    email: false,
    phone: false,
  });

  const [fieldValues, setFieldValues] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  const [sqlQuery, setSqlQuery] = useState("");

  // Toggle a checkbox (add / remove field)
  const toggleField = (field) => {
    setActiveFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    // Clear that field's value when hidden (optional)
    if (!activeFields[field]) {
      setFieldValues((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Update input value
  const handleInputChange = (field, value) => {
    setFieldValues((prev) => ({ ...prev, [field]: value }));
  };

  // Build SQL query dynamically
  const handleLogin = (e) => {
    e.preventDefault();

    const clauses = [];

    if (activeFields.username) {
      clauses.push(`username = '${fieldValues.username}'`);
    }
    if (activeFields.email) {
      clauses.push(`email = '${fieldValues.email}'`);
    }
    if (activeFields.phone) {
      clauses.push(`phone = '${fieldValues.phone}'`);
    }
    // Password is always included
    clauses.push(`password = '${fieldValues.password}'`);

    const whereClause = clauses.join(" AND ");
    const query = `SELECT * FROM users WHERE ${whereClause}`;
    setSqlQuery(query);
  };

  return (
    <div className="container px-4 py-8 mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Secure Web Shop</h1>
        <p className="text-muted-foreground mt-1">
          Secure login & product list for SQLi testing.
        </p>
      </div>

      {/* --- Login Form (dynamic fields) --- */}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Choose the login fields you want to use. <span className="font-medium">Password</span> is always required.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            {/* Field selectors */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select login fields</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-username"
                    checked={activeFields.username}
                    onCheckedChange={() => toggleField("username")}
                  />
                  <label
                    htmlFor="field-username"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Username
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-email"
                    checked={activeFields.email}
                    onCheckedChange={() => toggleField("email")}
                  />
                  <label
                    htmlFor="field-email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Email
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-phone"
                    checked={activeFields.phone}
                    onCheckedChange={() => toggleField("phone")}
                  />
                  <label
                    htmlFor="field-phone"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Phone Number
                  </label>
                </div>
              </div>
            </div>

            {/* Dynamic input fields */}
            {activeFields.username && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={fieldValues.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                />
              </div>
            )}

            {activeFields.email && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={fieldValues.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            )}

            {activeFields.phone && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 890"
                  value={fieldValues.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
            )}

            {/* Password – always shown */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={fieldValues.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-start gap-4">
            <Button type="submit" className="w-full">Log in</Button>
            {sqlQuery && (
              <div className="w-full p-3 rounded-md border bg-muted/50 text-sm font-mono break-all">
                <AlertTriangle className="inline h-4 w-4 text-destructive mr-1" />
                SQL Query: <span className="text-destructive">{sqlQuery}</span>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Products Grid (unchanged) */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Products</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="group flex flex-col">
              <CardHeader className="text-center pb-2">
                <div className="text-5xl mb-2">{product.img}</div>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription className="capitalize">{product.product_type}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-center">{product.price}</p>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button asChild variant="outline" className="w-full group-hover:bg-accent">
                  <Link href={`/secureweb/product/${product.id}`}>
                    View Details
              
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
       <h1 className="text-3xl font-bold tracking-tight">Prediction Table</h1>
            <ResultTable data={dummyResults}/>
    </div>
  );
}