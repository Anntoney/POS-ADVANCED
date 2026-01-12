"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type SystemSetting = {
  id: string
  setting_key: string
  setting_value: string | null
}

export function CompanySettings({ settings }: { settings: SystemSetting[] }) {
  const [companyName, setCompanyName] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [taxNumber, setTaxNumber] = useState("")
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("cash")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Load settings
    const getSetting = (key: string) => settings.find((s) => s.setting_key === key)?.setting_value || ""

    setCompanyName(getSetting("company_name"))
    setCompanyEmail(getSetting("company_email"))
    setCompanyPhone(getSetting("company_phone"))
    setCompanyAddress(getSetting("company_address"))
    setTaxNumber(getSetting("tax_number"))
    setDefaultPaymentMethod(getSetting("default_payment_method") || "cash")
  }, [settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    const settingsToUpdate = [
      { key: "company_name", value: companyName },
      { key: "company_email", value: companyEmail },
      { key: "company_phone", value: companyPhone },
      { key: "company_address", value: companyAddress },
      { key: "tax_number", value: taxNumber },
      { key: "default_payment_method", value: defaultPaymentMethod },
    ]

    try {
      for (const setting of settingsToUpdate) {
        const existing = settings.find((s) => s.setting_key === setting.key)

        if (existing) {
          const { error } = await supabase
            .from("system_settings")
            .update({ setting_value: setting.value })
            .eq("setting_key", setting.key)

          if (error) throw error
        } else {
          const { error } = await supabase.from("system_settings").insert({
            setting_key: setting.key,
            setting_value: setting.value,
          })

          if (error) throw error
        }
      }

      setSuccess(true)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>Configure your company details that appear on invoices and receipts</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Acme Corporation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companyEmail">Company Email</Label>
              <Input
                id="companyEmail"
                type="email"
                placeholder="info@company.com"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companyPhone">Company Phone</Label>
              <Input
                id="companyPhone"
                placeholder="+1234567890"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companyAddress">Company Address</Label>
              <Textarea
                id="companyAddress"
                placeholder="123 Business Street, City, Country"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="taxNumber">Tax Number / VAT</Label>
              <Input
                id="taxNumber"
                placeholder="123456789"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="defaultPaymentMethod">Default Payment Method</Label>
              <Select value={defaultPaymentMethod} onValueChange={setDefaultPaymentMethod}>
                <SelectTrigger id="defaultPaymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This payment method will be selected by default during checkout
              </p>
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              Company information updated successfully!
            </div>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
