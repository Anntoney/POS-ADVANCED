"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Supplier } from "@/lib/types/database"

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const [name, setName] = useState(supplier?.name || "")
  const [email, setEmail] = useState(supplier?.email || "")
  const [phone, setPhone] = useState(supplier?.phone || "")
  const [address, setAddress] = useState(supplier?.address || "")
  const [city, setCity] = useState(supplier?.city || "")
  const [country, setCountry] = useState(supplier?.country || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in")
      setIsLoading(false)
      return
    }

    const supplierData = {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country: country || null,
    }

    try {
      if (supplier) {
        const { error } = await supabase.from("suppliers").update(supplierData).eq("id", supplier.id)
        if (error) throw error
        alert("Supplier updated successfully!")
        router.push("/dashboard/suppliers")
        router.refresh()
      } else {
        const { error } = await supabase.from("suppliers").insert({
          ...supplierData,
          created_by: user.id,
        })
        if (error) throw error
        alert("Supplier created successfully!")
        setName("")
        setEmail("")
        setPhone("")
        setAddress("")
        setCity("")
        setCountry("")
        router.push("/dashboard/suppliers")
        router.refresh()
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{supplier ? "Edit Supplier" : "Create New Supplier"}</CardTitle>
        <CardDescription>
          {supplier ? "Update the supplier information below" : "Fill in the details to create a new supplier"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Supplier Co."
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="supplier@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Los Angeles" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="USA" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="456 Business Ave"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : supplier ? "Update Supplier" : "Create Supplier"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
