"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

export function LoadingDialog({ 
  isOpen, 
  message = "Processing..." 
}: { 
  isOpen: boolean
  message?: string 
}) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogTitle className="sr-only">{message}</DialogTitle>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-center">{message}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
