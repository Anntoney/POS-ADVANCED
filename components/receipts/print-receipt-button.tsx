"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { ReceiptGenerator } from "./receipt-generator"

interface PrintReceiptButtonProps {
  type: "sale" | "payment"
  saleId?: string
  paymentId?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export function PrintReceiptButton({
  type,
  saleId,
  paymentId,
  variant = "outline",
  size = "default",
  className,
  children
}: PrintReceiptButtonProps) {
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)

  const handlePrint = () => {
    setShowReceiptDialog(true)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handlePrint}
        className={className}
      >
        <Printer className="h-4 w-4 mr-2" />
        {children || `Print ${type === "sale" ? "Receipt" : "Payment Receipt"}`}
      </Button>

      <ReceiptGenerator
        isOpen={showReceiptDialog}
        onClose={() => setShowReceiptDialog(false)}
        type={type}
        saleId={saleId}
        paymentId={paymentId}
      />
    </>
  )
}