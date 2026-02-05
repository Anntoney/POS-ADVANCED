"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Printer, Receipt, X } from "lucide-react"
import { ReceiptGenerator } from "./receipt-generator"

interface PrintReceiptDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  saleId?: string
  paymentId?: string
  type: "sale" | "payment"
  onPrintComplete?: () => void
}

export function PrintReceiptDialog({
  isOpen,
  onClose,
  title,
  description,
  saleId,
  paymentId,
  type,
  onPrintComplete
}: PrintReceiptDialogProps) {
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [printNow, setPrintNow] = useState(false)

  const handlePrintReceipt = () => {
    setShowPrintDialog(true)
  }

  const handleSkip = () => {
    onClose()
    onPrintComplete?.()
  }

  const handlePrintComplete = () => {
    setShowPrintDialog(false)
    onClose()
    onPrintComplete?.()
  }

  return (
    <>
      <Dialog open={isOpen && !showPrintDialog} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {title}
            </DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 text-center">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {type === "sale" ? "Sale completed successfully!" : "Payment recorded successfully!"}
            </p>
            <p className="text-sm text-muted-foreground">
              Would you like to print a receipt?
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto">
              <X className="h-4 w-4 mr-2" />
              Skip
            </Button>
            <Button onClick={handlePrintReceipt} className="w-full sm:w-auto">
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptGenerator
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        type={type}
        saleId={saleId}
        paymentId={paymentId}
        onPrintComplete={handlePrintComplete}
      />
    </>
  )
}