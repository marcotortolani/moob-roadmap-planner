"use client"

import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

function toast({ title, description, variant }: ToastProps) {
  // Construir el mensaje combinando título y descripción
  const message = title || description || ""
  const descriptionText = title && description ? description : undefined

  if (variant === "destructive") {
    return sonnerToast.error(message, {
      description: descriptionText,
    })
  }

  return sonnerToast(message, {
    description: descriptionText,
  })
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  }
}

export { useToast, toast }
