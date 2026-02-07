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
  const [receiptFormat] = useState<"thermal" | "standard">("thermal") // Always thermal
  const [isLoading, setIsLoading] = useState(false)
  const [currency, setCurrency] = useState<Currency | null>(null)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [saleData, setSaleData] = useState<SaleData | null>(null)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [salePayments, setSalePayments] = useState<SalePayment[]>([])
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [cashierName, setCashierName] = useState<string>("Cashier")
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setHasAutoPrinted(false)
      loadData()
    }
  }, [isOpen, saleId, paymentId, type])

  useEffect(() => {
    getDefaultCurrency().then(setCurrency)
  }, [])

  // Auto-print when data is loaded
  useEffect(() => {
    if (isOpen && !isLoading && !hasAutoPrinted && saleData && companySettings && currency) {
      setHasAutoPrinted(true)
      // Small delay to ensure everything is rendered, then print and close
      setTimeout(() => {
        handlePrint()
        // Close our dialog immediately after triggering print
        setTimeout(() => {
          onClose()
        }, 200)
      }, 300)
    }
  }, [isOpen, isLoading, hasAutoPrinted, saleData, companySettings, currency])

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Get current user's profile for cashier name
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()
        
        if (profile?.full_name) {
          setCashierName(profile.full_name)
        }
      }

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
    const width = isThermal ? "72mm" : "210mm"
    const fontSize = isThermal ? "14px" : "14px"
    const headerSize = isThermal ? "18px" : "20px"

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
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: ${fontSize};
              font-weight: bold;
              line-height: 1.5;
              margin: 0;
              padding: ${isThermal ? "5mm" : "20px"};
              width: ${width};
              max-width: ${width};
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 2px dashed #000;
              padding-bottom: 8px;
            }
            .header h1 {
              font-size: ${headerSize};
              margin: 0 0 5px 0;
              font-weight: bold;
              word-wrap: break-word;
            }
            .header p {
              margin: 2px 0;
              font-size: ${isThermal ? "11px" : "12px"};
              word-wrap: break-word;
            }
            .receipt-info {
              margin-bottom: 10px;
              border-bottom: 2px dashed #000;
              padding-bottom: 8px;
              font-size: ${isThermal ? "13px" : "14px"};
            }
            .receipt-info div {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              word-wrap: break-word;
            }
            .receipt-info span:first-child {
              flex-shrink: 0;
              margin-right: 5px;
            }
            .receipt-info span:last-child {
              text-align: right;
              word-break: break-all;
            }
            .items {
              margin-bottom: 10px;
            }
            .item {
              margin-bottom: 8px;
              border-bottom: 1px dotted #000;
              padding-bottom: 5px;
            }
            .item-name {
              font-weight: bold;
              margin-bottom: 3px;
              font-size: ${isThermal ? "14px" : "14px"};
              word-wrap: break-word;
            }
            .item-details {
              display: flex;
              justify-content: space-between;
              font-size: ${isThermal ? "13px" : "13px"};
            }
            .item-details span:first-child {
              flex-shrink: 0;
            }
            .item-details span:last-child {
              text-align: right;
              margin-left: 5px;
            }
            .totals {
              border-top: 2px dashed #000;
              padding-top: 8px;
              margin-bottom: 10px;
              font-size: ${isThermal ? "14px" : "15px"};
            }
            .totals div {
              display: flex;
              justify-content: space-between;
              margin: 4px 0;
            }
            .total-line {
              font-weight: bold;
              font-size: ${isThermal ? "16px" : "17px"};
              border-top: 2px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .payments {
              margin-bottom: 10px;
              border-top: 2px dashed #000;
              padding-top: 8px;
              font-size: ${isThermal ? "14px" : "14px"};
            }
            .payments h3 {
              margin: 0 0 5px 0;
              font-size: ${isThermal ? "15px" : "16px"};
              font-weight: bold;
            }
            .payment-item {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .change {
              font-weight: bold;
              font-size: ${isThermal ? "16px" : "17px"};
              text-align: center;
              margin: 10px 0;
              padding: 8px;
              border: 2px solid #000;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              border-top: 2px dashed #000;
              padding-top: 8px;
              font-size: ${isThermal ? "12px" : "12px"};
            }
            .footer p {
              margin: 3px 0;
              word-wrap: break-word;
            }
            @media print {
              body { 
                margin: 0;
                padding: ${isThermal ? "5mm" : "10mm"};
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${companySettings.company_name}</h1>
            ${companySettings.company_address ? `<p>${companySettings.company_address}</p>` : ""}
            ${companySettings.company_phone ? `<p>Tel: ${companySettings.company_phone}</p>` : ""}
            ${companySettings.company_email ? `<p>${companySettings.company_email}</p>` : ""}
            ${companySettings.tax_number ? `<p>Tax: ${companySettings.tax_number}</p>` : ""}
          </div>

          <div class="receipt-info">
            <div><span>Receipt:</span><span>${saleData.sale_number}</span></div>
            <div><span>Date:</span><span>${new Date(saleData.sale_date).toLocaleString()}</span></div>
            ${saleData.customers ? `<div><span>Customer:</span><span>${saleData.customers.name}</span></div>` : ""}
            <div><span>Cashier:</span><span>${cashierName}</span></div>
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
            <h1>${companySettings.company_name}</h1>
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
      
      // Wait for content to load, then auto-print
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
      }
      
      printWindow.onafterprint = () => {
        printWindow.close()
        onPrintComplete?.()
        onClose()
      }
      
      // Fallback: if onload doesn't fire, print after short delay
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.focus()
          printWindow.print()
        }
      }, 100)
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
            {isLoading ? "Preparing Receipt..." : "Printing Receipt"}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? "Loading receipt data..." : "Receipt is being sent to printer..."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 text-center">
          {isLoading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading receipt data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Printer className="h-16 w-16 mx-auto text-primary animate-pulse" />
              <div>
                <p className="font-medium">Printing receipt...</p>
                {type === "sale" && saleData && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <p>Sale: {saleData.sale_number}</p>
                    <p>Total: {currency ? formatCurrency(Number(saleData.total_amount), currency) : saleData.total_amount}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}