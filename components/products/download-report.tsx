"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { formatCurrency, type Currency } from "@/lib/utils/currency"

type Product = {
  id: string
  name: string
  cost_price: number
  selling_price: number
  wholesale_price?: number | null
  stock_quantity: number
  is_active: boolean
  categories: { id: string; name: string } | null
  units: { id: string; name: string; short_name: string } | null
}

interface DownloadProductsReportProps {
  products: Product[]
  currency: Currency
}

export function DownloadProductsReport({ products, currency }: DownloadProductsReportProps) {
  const generatePDF = () => {
    if (products.length === 0) {
      alert("No products to export")
      return
    }

    const reportContent = generateReportHTML()
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(reportContent)
      printWindow.document.close()
      // Small delay to ensure content is loaded before printing
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  const generateReportHTML = () => {
    const today = new Date().toLocaleDateString()
    const currencySymbol = currency?.symbol || "$"

    // Calculate totals
    const totalBuyingValue = products.reduce(
      (sum, product) => sum + Number(product.cost_price || 0) * Number(product.stock_quantity || 0),
      0,
    )
    const totalSellingValue = products.reduce(
      (sum, product) => sum + Number(product.selling_price || 0) * Number(product.stock_quantity || 0),
      0,
    )
    const totalStock = products.reduce((sum, product) => sum + Number(product.stock_quantity || 0), 0)

    const productRows = products
      .map((product) => {
        const buyingValue = Number(product.cost_price || 0) * Number(product.stock_quantity || 0)
        const sellingValue = Number(product.selling_price || 0) * Number(product.stock_quantity || 0)

        return `
          <tr>
            <td>${product.name}</td>
            <td>${product.categories?.name || "N/A"}</td>
            <td class="text-right">${formatCurrency(Number(product.cost_price || 0), currency)}</td>
            <td class="text-right">${formatCurrency(Number(product.selling_price || 0), currency)}</td>
            <td class="text-right">${product.wholesale_price ? formatCurrency(Number(product.wholesale_price), currency) : "N/A"}</td>
            <td class="text-right">${product.stock_quantity} ${product.units?.short_name || ""}</td>
            <td class="text-right">${formatCurrency(buyingValue, currency)}</td>
            <td class="text-right">${formatCurrency(sellingValue, currency)}</td>
            <td class="text-center">${product.is_active ? "Active" : "Inactive"}</td>
          </tr>
        `
      })
      .join("")

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Products Report - ${today}</title>
          <style>
            @media print {
              @page {
                margin: 1cm;
                size: A4 landscape;
              }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
              font-size: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 3px solid #333;
              padding-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              color: #666;
              font-size: 12px;
            }
            .summary {
              display: flex;
              justify-content: space-around;
              margin: 20px 0;
              padding: 15px;
              background-color: #f5f5f5;
              border-radius: 5px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-item h3 {
              margin: 0 0 5px 0;
              font-size: 11px;
              color: #666;
              font-weight: normal;
            }
            .summary-item .value {
              font-size: 18px;
              font-weight: bold;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #333;
              color: white;
              padding: 10px 8px;
              text-align: left;
              font-weight: bold;
              font-size: 10px;
              border: 1px solid #555;
            }
            th.text-right {
              text-align: right;
            }
            th.text-center {
              text-align: center;
            }
            td {
              padding: 8px;
              border: 1px solid #ddd;
              font-size: 9px;
            }
            td.text-right {
              text-align: right;
            }
            td.text-center {
              text-align: center;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #f5f5f5;
            }
            .total-row {
              background-color: #333 !important;
              color: white;
              font-weight: bold;
            }
            .total-row td {
              border-color: #555;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 9px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Products Inventory Report</h1>
            <p>Generated on: ${today}</p>
            <p>Total Products: ${products.length}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <h3>Total Buying Value</h3>
              <div class="value">${formatCurrency(totalBuyingValue, currency)}</div>
            </div>
            <div class="summary-item">
              <h3>Total Selling Value</h3>
              <div class="value">${formatCurrency(totalSellingValue, currency)}</div>
            </div>
            <div class="summary-item">
              <h3>Total Stock Quantity</h3>
              <div class="value">${totalStock}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th class="text-right">Buying Price</th>
                <th class="text-right">Selling Price</th>
                <th class="text-right">Wholesale Price</th>
                <th class="text-right">Stock</th>
                <th class="text-right">Total Buying Value</th>
                <th class="text-right">Total Selling Value</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
              <tr class="total-row">
                <td colspan="5"><strong>TOTAL</strong></td>
                <td class="text-right"><strong>${totalStock}</strong></td>
                <td class="text-right"><strong>${formatCurrency(totalBuyingValue, currency)}</strong></td>
                <td class="text-right"><strong>${formatCurrency(totalSellingValue, currency)}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>This is a computer-generated report and does not require a signature.</p>
            <p>Report generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `
  }

  return (
    <Button variant="outline" onClick={generatePDF} disabled={products.length === 0}>
      <Download className="mr-2 h-4 w-4" />
      Download Report
    </Button>
  )
}
