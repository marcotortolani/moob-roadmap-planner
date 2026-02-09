"use client"

import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success" | "warning" | "info"
}

function toast({ title, description, variant = "default" }: ToastProps) {
  // Construir el mensaje combinando título y descripción
  const message = title || description || ""
  const descriptionText = title && description ? description : undefined

  switch (variant) {
    case "destructive":
      return sonnerToast.error(message, {
        description: descriptionText,
      })
    case "success":
      return sonnerToast.success(message, {
        description: descriptionText,
      })
    case "warning":
      return sonnerToast.warning(message, {
        description: descriptionText,
      })
    case "info":
      return sonnerToast.info(message, {
        description: descriptionText,
      })
    default:
      return sonnerToast(message, {
        description: descriptionText,
      })
  }
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  }
}

export { useToast, toast }
