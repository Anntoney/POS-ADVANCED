"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { clearCurrencyCache } from "@/lib/utils/currency"

type Currency = {
  id: string
  code: string
  name: string
  symbol: string
  exchange_rate: number
  is_default: boolean
}

export function CurrencySettings({ currencies }: { currencies: Currency[] }) {
  const [isAddingCurrency, setIsAddingCurrency] = useState(false)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [exchangeRate, setExchangeRate] = useState("1.00")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("currencies").insert({
        code: code.toUpperCase(),
        name,
        symbol,
        exchange_rate: Number.parseFloat(exchangeRate),
        is_default: currencies.length === 0,
      })

      if (error) throw error

      clearCurrencyCache()
      setCode("")
      setName("")
      setSymbol("")
      setExchangeRate("1.00")
      setIsAddingCurrency(false)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    const supabase = createClient()

    try {
      // Unset all defaults
      await supabase.from("currencies").update({ is_default: false }).neq("id", "")

      // Set new default
      const { error } = await supabase.from("currencies").update({ is_default: true }).eq("id", id)

      if (error) throw error

      clearCurrencyCache()
      router.refresh()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this currency?")) return

    const supabase = createClient()
    const { error } = await supabase.from("currencies").delete().eq("id", id)

    if (error) {
      alert("Error deleting currency: " + error.message)
    } else {
      clearCurrencyCache()
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <Card className="max-w-4xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Currency Settings</CardTitle>
              <CardDescription>Manage currencies and exchange rates for your business</CardDescription>
            </div>
            {!isAddingCurrency && (
              <Button onClick={() => setIsAddingCurrency(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Currency
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isAddingCurrency && (
            <form onSubmit={handleAddCurrency} className="mb-6 p-4 border rounded-lg space-y-4">
              <h3 className="font-semibold">Add New Currency</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="code">Currency Code</Label>
                  <Input
                    id="code"
                    placeholder="USD"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    maxLength={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Currency Name</Label>
                  <Input
                    id="name"
                    placeholder="US Dollar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="$"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="exchangeRate">Exchange Rate</Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1.00"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Currency"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingCurrency(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {currencies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No currencies configured yet</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Exchange Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((currency) => (
                    <TableRow key={currency.id}>
                      <TableCell className="font-medium">{currency.code}</TableCell>
                      <TableCell>{currency.name}</TableCell>
                      <TableCell>{currency.symbol}</TableCell>
                      <TableCell>{Number(currency.exchange_rate).toFixed(2)}</TableCell>
                      <TableCell>{currency.is_default && <Badge variant="default">Default</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!currency.is_default && (
                            <Button variant="ghost" size="icon" onClick={() => handleSetDefault(currency.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(currency.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
  )
}
