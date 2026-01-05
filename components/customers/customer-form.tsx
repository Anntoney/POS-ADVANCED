"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Customer } from "@/lib/types/database"

export function CustomerForm({ customer }: { customer?: Customer }) {
  const [name, setName] = useState(customer?.name || "")
  const [email, setEmail] = useState(customer?.email || "")
  const [phone, setPhone] = useState(customer?.phone || "")
  const [address, setAddress] = useState(customer?.address || "")
  const [city, setCity] = useState(customer?.city || "")
  const [country, setCountry] = useState(customer?.country || "")
  const [creditLimit, setCreditLimit] = useState(customer?.credit_limit.toString() || "0")
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

    const customerData = {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country: country || null,
      credit_limit: Number.parseFloat(creditLimit),
    }

    try {
      if (customer) {
        const { error } = await supabase.from("customers").update(customerData).eq("id", customer.id)
        if (error) throw error
        alert("Customer updated successfully!")
        router.push("/dashboard/customers")
        router.refresh()
      } else {
        const { error } = await supabase.from("customers").insert({
          ...customerData,
          created_by: user.id,
        })
        if (error) throw error
        alert("Customer created successfully!")
        setName("")
        setEmail("")
        setPhone("")
        setAddress("")
        setCity("")
        setCountry("")
        setCreditLimit("0")
        router.push("/dashboard/customers")
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
        <CardTitle>{customer ? "Edit Customer" : "Create New Customer"}</CardTitle>
        <CardDescription>
          {customer ? "Update the customer information below" : "Fill in the details to create a new customer"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
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
              <Input id="city" placeholder="New York" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="USA" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main Street"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : customer ? "Update Customer" : "Create Customer"}
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
