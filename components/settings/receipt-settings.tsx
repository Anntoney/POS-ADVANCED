"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Receipt, Printer, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type SystemSetting = {
  id: string
  setting_key: string
  setting_value: string | null
}

export function ReceiptSettings({ settings }: { settings: SystemSetting[] }) {
  const [defaultReceiptFormat, setDefaultReceiptFormat] = useState<"thermal" | "standard">("thermal")
  const [autoPrintSales, setAutoPrintSales] = useState(false)
  const [autoPrintPayments, setAutoPrintPayments] = useState(false)
  const [receiptFooterText, setReceiptFooterText] = useState("")
  const [thermalPrinterWidth, setThermalPrinterWidth] = useState("80")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Load settings
    const getSetting = (key: string) => settings.find((s) => s.setting_key === key)?.setting_value || ""

    setDefaultReceiptFormat((getSetting("default_receipt_format") as "thermal" | "standard") || "thermal")
    setAutoPrintSales(getSetting("auto_print_sales") === "true")
    setAutoPrintPayments(getSetting("auto_print_payments") === "true")
    setReceiptFooterText(getSetting("receipt_footer_text"))
    setThermalPrinterWidth(getSetting("thermal_printer_width") || "80")
  }, [settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    try {
      const settingsToUpdate = [
        { key: "default_receipt_format", value: defaultReceiptFormat },
        { key: "auto_print_sales", value: autoPrintSales.toString() },
        { key: "auto_print_payments", value: autoPrintPayments.toString() },
        { key: "receipt_footer_text", value: receiptFooterText },
        { key: "thermal_printer_width", value: thermalPrinterWidth },
      ]

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from("system_settings")
          .upsert(
            {
              setting_key: setting.key,
              setting_value: setting.value,
            },
            {
              onConflict: "setting_key",
            }
          )

        if (error) throw error
      }

      setSuccess(true)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestPrint = () => {
    const testReceiptHTML = generateTestReceiptHTML()
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(testReceiptHTML)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const generateTestReceiptHTML = () => {
    const isThermal = defaultReceiptFormat === "thermal"
    const width = isThermal ? `${thermalPrinterWidth}mm` : "210mm"
    const fontSize = isThermal ? "12px" : "14px"
    const headerSize = isThermal ? "16px" : "20px"

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Receipt</title>
          <style>
            @page {
              size: ${width} auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: ${fontSize};
              line-height: 1.4;
              margin: 0;
              padding: ${isThermal ? "10px" : "20px"};
              width: ${width};
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .header h1 {
              font-size: ${headerSize};
              margin: 0 0 5px 0;
              font-weight: bold;
            }
            .content {
              margin: 15px 0;
              text-align: center;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              border-top: 1px dashed #000;
              padding-top: 10px;
              font-size: ${isThermal ? "10px" : "12px"};
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TEST RECEIPT</h1>
            <p>Receipt Format: ${defaultReceiptFormat.toUpperCase()}</p>
            <p>Width: ${width}</p>
          </div>

          <div class="content">
            <p><strong>This is a test receipt</strong></p>
            <p>Date: ${new Date().toLocaleString()}</p>
            <p>Format: ${defaultReceiptFormat === "thermal" ? "Thermal Printer" : "Standard Printer"}</p>
            ${isThermal ? `<p>Printer Width: ${thermalPrinterWidth}mm</p>` : ""}
          </div>

          <div class="footer">
            <p>Receipt printing is working correctly!</p>
            ${receiptFooterText ? `<p>${receiptFooterText}</p>` : ""}
          </div>
        </body>
      </html>
    `
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Receipt Settings
        </CardTitle>
        <CardDescription>
          Configure receipt printing preferences and formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              Receipt settings updated successfully!
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receiptFormat">Default Receipt Format</Label>
                <Select value={defaultReceiptFormat} onValueChange={(value: "thermal" | "standard") => setDefaultReceiptFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal">Thermal (POS Printer)</SelectItem>
                    <SelectItem value="standard">Standard (A4 Printer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {defaultReceiptFormat === "thermal" && (
                <div className="space-y-2">
                  <Label htmlFor="printerWidth">Thermal Printer Width (mm)</Label>
                  <Select value={thermalPrinterWidth} onValueChange={setThermalPrinterWidth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58">58mm</SelectItem>
                      <SelectItem value="80">80mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-print-sales"
                    checked={autoPrintSales}
                    onCheckedChange={setAutoPrintSales}
                  />
                  <Label htmlFor="auto-print-sales">Auto-print sales receipts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-print-payments"
                    checked={autoPrintPayments}
                    onCheckedChange={setAutoPrintPayments}
                  />
                  <Label htmlFor="auto-print-payments">Auto-print payment receipts</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footerText">Receipt Footer Text</Label>
                <Textarea
                  id="footerText"
                  placeholder="Thank you for your business!"
                  value={receiptFooterText}
                  onChange={(e) => setReceiptFooterText(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This text will appear at the bottom of all receipts
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestPrint}
                  className="w-full"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Test Print Receipt
                </Button>
                <p className="text-xs text-muted-foreground">
                  Print a test receipt to verify your settings
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}