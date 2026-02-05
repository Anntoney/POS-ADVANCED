"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Printer, FileText, Receipt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getDefaultCurrency, formatCurrency, type Currency } from "@/lib/utils/currency"

type ReceiptType = "sale" | "payment"

type SaleData = {
  id: string
  sale_number: string
  sale_date: string
  customer_id: string | null
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  amount_paid: number
  payment_status: string
  notes: string | null
  customers?: {
    name: string
    email: string | null
    phone: string | null
    address: string | null
  } | null
}

type SaleItem = {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  total_amount: number
}

type SalePayment = {
  id: string
  payment_method: string
  amount: number
  payment_date: string
}

type PaymentData = {
  id: string
  payment_number: string
  customer_id: string
  amount: number
  payment_method: string
  payment_date: string
  notes: string | null
  customers: {
    name: string
    email: string | null
    phone: string | null
    address: string | null
  }
}

type CompanySettings = {
  company_name: string
  company_email: string
  company_phone: string
  company_address: string
  tax_number: string
}

interface ReceiptGeneratorProps {
  isOpen: boolean
  onClose: () => void
  type: ReceiptType
  saleId?: string
  paymentId?: string
  onPrintComplete?: () => void
}

export function ReceiptGenerator({
  isOpen,
  onClose,
  type,
  saleId,
  paymentId,
  onPrintComplete
}: ReceiptGeneratorProps) {
  const [receiptFormat, setReceiptFormat] = useState<"thermal" | "standard">("thermal")
  const [autoPrint, setAutoPrint] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currency, setCurrency] = useState<Currency | null>(null)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [saleData, setSaleData] = useState<SaleData | null>(null)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [salePayments, setSalePayments] = useState<SalePayment[]>([])
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, saleId, paymentId, type])

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Load company settings
      const { data: settings } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["company_name", "company_email", "company_phone", "company_address", "tax_number"])

      if (settings) {
        const settingsObj = settings.reduce((acc, setting) => {
          acc[setting.setting_key as keyof CompanySettings] = setting.setting_value || ""
          return acc
        }, {} as CompanySettings)
        setCompanySettings(settingsObj)
      }

      if (type === "sale" && saleId) {
        // Load sale data
        const { data: sale } = await supabase
          .from("sales")
          .select(`
            *,
            customers (name, email, phone, address)
          `)
          .eq("id", saleId)
          .single()

        if (sale) setSaleData(sale)

        // Load sale items
        const { data: items } = await supabase
          .from("sale_items")
          .select("*")
          .eq("sale_id", saleId)
          .order("created_at")

        if (items) setSaleItems(items)

        // Load sale payments
        const { data: payments } = await supabase
          .from("sale_payments")
          .select("*")
          .eq("sale_id", saleId)
          .order("created_at")

        if (payments) setSalePayments(payments)
      } else if (type === "payment" && paymentId) {
        // Load payment data
        const { data: payment } = await supabase
          .from("customer_payments")
          .select(`
            *,
            customers (name, email, phone, address)
          `)
          .eq("id", paymentId)
          .single()

        if (payment) setPaymentData(payment)
      }
    } catch (error) {
      console.error("Error loading receipt data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateReceiptHTML = () => {
    if (type === "sale") {
      return generateSaleReceiptHTML()
    } else {
      return generatePaymentReceiptHTML()
    }
  }

  const generateSaleReceiptHTML = () => {
    if (!saleData || !companySettings || !currency) return ""

    const isThermal = receiptFormat === "thermal"
    const width = isThermal ? "80mm" : "210mm"
    const fontSize = isThermal ? "12px" : "14px"
    const headerSize = isThermal ? "16px" : "20px"

    const change = salePayments.reduce((sum, p) => sum + Number(p.amount), 0) - Number(saleData.total_amount)

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Receipt - ${saleData.sale_number}</title>
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
            .header p {
              margin: 2px 0;
              font-size: ${isThermal ? "10px" : "12px"};
            }
            .receipt-info {
              margin-bottom: 15px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .receipt-info div {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .items {
              margin-bottom: 15px;
            }
            .item {
              margin-bottom: 8px;
              border-bottom: 1px dotted #ccc;
              padding-bottom: 5px;
            }
            .item-name {
              font-weight: bold;
              margin-bottom: 2px;
            }
            .item-details {
              display: flex;
              justify-content: space-between;
              font-size: ${isThermal ? "11px" : "13px"};
            }
            .totals {
              border-top: 1px dashed #000;
              padding-top: 10px;
              margin-bottom: 15px;
            }
            .totals div {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .total-line {
              font-weight: bold;
              font-size: ${isThermal ? "13px" : "15px"};
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .payments {
              margin-bottom: 15px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            .payments h3 {
              margin: 0 0 8px 0;
              font-size: ${isThermal ? "12px" : "14px"};
            }
            .payment-item {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .change {
              font-weight: bold;
              font-size: ${isThermal ? "13px" : "15px"};
              text-align: center;
              margin: 10px 0;
              padding: 5px;
              border: 1px solid #000;
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
            <h1>${companySettings.company_name || "STORE NAME"}</h1>
            ${companySettings.company_address ? `<p>${companySettings.company_address}</p>` : ""}
            ${companySettings.company_phone ? `<p>Tel: ${companySettings.company_phone}</p>` : ""}
            ${companySettings.company_email ? `<p>Email: ${companySettings.company_email}</p>` : ""}
            ${companySettings.tax_number ? `<p>Tax No: ${companySettings.tax_number}</p>` : ""}
          </div>

          <div class="receipt-info">
            <div><span>Receipt #:</span><span>${saleData.sale_number}</span></div>
            <div><span>Date:</span><span>${new Date(saleData.sale_date).toLocaleString()}</span></div>
            ${saleData.customers ? `<div><span>Customer:</span><span>${saleData.customers.name}</span></div>` : ""}
            <div><span>Cashier:</span><span>System User</span></div>
          </div>

          <div class="items">
            ${saleItems.map(item => `
              <div class="item">
                <div class="item-name">${item.product_name}</div>
                <div class="item-details">
                  <span>${item.quantity} x ${formatCurrency(Number(item.unit_price), currency)}</span>
                  <span>${formatCurrency(Number(item.total_amount), currency)}</span>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="totals">
            <div><span>Subtotal:</span><span>${formatCurrency(Number(saleData.subtotal), currency)}</span></div>
            ${Number(saleData.discount_amount) > 0 ? `<div><span>Discount:</span><span>-${formatCurrency(Number(saleData.discount_amount), currency)}</span></div>` : ""}
            ${Number(saleData.tax_amount) > 0 ? `<div><span>Tax:</span><span>${formatCurrency(Number(saleData.tax_amount), currency)}</span></div>` : ""}
            <div class="total-line"><span>TOTAL:</span><span>${formatCurrency(Number(saleData.total_amount), currency)}</span></div>
          </div>

          ${salePayments.length > 0 ? `
            <div class="payments">
              <h3>PAYMENTS:</h3>
              ${salePayments.map(payment => `
                <div class="payment-item">
                  <span>${payment.payment_method.toUpperCase()}:</span>
                  <span>${formatCurrency(Number(payment.amount), currency)}</span>
                </div>
              `).join("")}
            </div>
          ` : ""}

          ${change > 0 ? `
            <div class="change">
              CHANGE: ${formatCurrency(change, currency)}
            </div>
          ` : ""}

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Please keep this receipt for your records</p>
            ${saleData.notes ? `<p>Note: ${saleData.notes}</p>` : ""}
          </div>
        </body>
      </html>
    `
  }

  const generatePaymentReceiptHTML = () => {
    if (!paymentData || !companySettings || !currency) return ""

    const isThermal = receiptFormat === "thermal"
    const width = isThermal ? "80mm" : "210mm"
    const fontSize = isThermal ? "12px" : "14px"
    const headerSize = isThermal ? "16px" : "20px"

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${paymentData.payment_number}</title>
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
            .header p {
              margin: 2px 0;
              font-size: ${isThermal ? "10px" : "12px"};
            }
            .receipt-type {
              text-align: center;
              font-weight: bold;
              font-size: ${isThermal ? "14px" : "16px"};
              margin-bottom: 15px;
              padding: 5px;
              border: 1px solid #000;
            }
            .payment-info {
              margin-bottom: 15px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .payment-info div {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .amount {
              text-align: center;
              font-weight: bold;
              font-size: ${isThermal ? "16px" : "20px"};
              margin: 15px 0;
              padding: 10px;
              border: 2px solid #000;
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
            <h1>${companySettings.company_name || "STORE NAME"}</h1>
            ${companySettings.company_address ? `<p>${companySettings.company_address}</p>` : ""}
            ${companySettings.company_phone ? `<p>Tel: ${companySettings.company_phone}</p>` : ""}
            ${companySettings.company_email ? `<p>Email: ${companySettings.company_email}</p>` : ""}
            ${companySettings.tax_number ? `<p>Tax No: ${companySettings.tax_number}</p>` : ""}
          </div>

          <div class="receipt-type">
            PAYMENT RECEIPT
          </div>

          <div class="payment-info">
            <div><span>Receipt #:</span><span>${paymentData.payment_number}</span></div>
            <div><span>Date:</span><span>${new Date(paymentData.payment_date).toLocaleString()}</span></div>
            <div><span>Customer:</span><span>${paymentData.customers.name}</span></div>
            ${paymentData.customers.phone ? `<div><span>Phone:</span><span>${paymentData.customers.phone}</span></div>` : ""}
            <div><span>Payment Method:</span><span>${paymentData.payment_method.toUpperCase()}</span></div>
          </div>

          <div class="amount">
            AMOUNT PAID: ${formatCurrency(Number(paymentData.amount), currency)}
          </div>

          <div class="footer">
            <p>Payment received with thanks!</p>
            <p>Please keep this receipt for your records</p>
            ${paymentData.notes ? `<p>Note: ${paymentData.notes}</p>` : ""}
          </div>
        </body>
      </html>
    `
  }

  const handlePrint = () => {
    const receiptHTML = generateReceiptHTML()
    if (!receiptHTML) return

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(receiptHTML)
      printWindow.document.close()
      
      if (autoPrint) {
        printWindow.print()
        printWindow.onafterprint = () => {
          printWindow.close()
          onPrintComplete?.()
          onClose()
        }
      } else {
        onPrintComplete?.()
      }
    }
  }

  const handlePreview = () => {
    const receiptHTML = generateReceiptHTML()
    if (!receiptHTML) return

    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      previewWindow.document.write(receiptHTML)
      previewWindow.document.close()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Print {type === "sale" ? "Sales" : "Payment"} Receipt
          </DialogTitle>
          <DialogDescription>
            Configure and print a receipt for this {type === "sale" ? "sale" : "payment"}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">Loading receipt data...</div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="format">Receipt Format</Label>
              <Select value={receiptFormat} onValueChange={(value: "thermal" | "standard") => setReceiptFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">Thermal (80mm) - POS Printer</SelectItem>
                  <SelectItem value="standard">Standard (A4) - Regular Printer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-print"
                checked={autoPrint}
                onCheckedChange={setAutoPrint}
              />
              <Label htmlFor="auto-print">Auto-print after opening</Label>
            </div>

            {type === "sale" && saleData && (
              <div className="text-sm text-muted-foreground">
                <p>Sale: {saleData.sale_number}</p>
                <p>Total: {currency ? formatCurrency(Number(saleData.total_amount), currency) : saleData.total_amount}</p>
                {saleData.customers && <p>Customer: {saleData.customers.name}</p>}
              </div>
            )}

            {type === "payment" && paymentData && (
              <div className="text-sm text-muted-foreground">
                <p>Payment: {paymentData.payment_number}</p>
                <p>Amount: {currency ? formatCurrency(Number(paymentData.amount), currency) : paymentData.amount}</p>
                <p>Customer: {paymentData.customers.name}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handlePreview} disabled={isLoading}>
            <FileText className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handlePrint} disabled={isLoading}>
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}