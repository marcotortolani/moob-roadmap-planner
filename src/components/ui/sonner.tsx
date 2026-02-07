"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      style={{ fontFamily: "inherit", overflowWrap: "anywhere" }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "bg-white text-black border-black border-2 font-heading shadow-[4px_4px_0px_0px_#000000] rounded-sm text-sm flex items-center gap-2.5 p-4 w-[356px] [&:has(button)]:justify-between",
          description: "font-base text-black",
          actionButton:
            "font-base border-2 text-xs h-6 px-2 bg-sky-200 text-black border-black rounded-sm shrink-0 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all",
          cancelButton:
            "font-base border-2 text-xs h-6 px-2 bg-white text-black border-black rounded-sm shrink-0 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all",
          error: "bg-red-500 text-white border-black",
          success: "bg-green-500 text-white border-black",
          warning: "bg-yellow-500 text-black border-black",
          info: "bg-sky-200 text-black border-black",
          loading:
            "[&[data-sonner-toast]_[data-icon]]:flex [&[data-sonner-toast]_[data-icon]]:size-4 [&[data-sonner-toast]_[data-icon]]:relative [&[data-sonner-toast]_[data-icon]]:justify-start [&[data-sonner-toast]_[data-icon]]:items-center [&[data-sonner-toast]_[data-icon]]:flex-shrink-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
