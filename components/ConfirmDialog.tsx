'use client'

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  cancelText?: string
  confirmText?: string
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  cancelText = 'Batal',
  confirmText = 'Lanjutkan',
  variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-md">
        <AlertDialogHeader className="space-y-4">
          <AlertDialogTitle className="text-2xl font-bold text-zinc-900 tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-500 text-base leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
          <AlertDialogCancel 
            variant="ghost" 
            className="rounded-xl px-6 py-6 font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all border-none"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            className={`rounded-xl px-8 py-6 font-bold shadow-lg transition-transform active:scale-95 ${
              variant === 'destructive' 
              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 text-white' 
              : 'bg-zinc-900 hover:bg-black shadow-zinc-200 text-white'
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
