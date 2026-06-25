'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, X, FileText, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  id: string
  file: File
  preview: string | null
}

interface MediaUploaderProps {
  value: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export function MediaUploader({ value, onChange }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addFiles = useCallback(
    (fileList: FileList) => {
      setError(null)
      const toAdd: UploadedFile[] = []
      for (const file of Array.from(fileList)) {
        if (!ACCEPTED.includes(file.type)) {
          setError('סוג קובץ לא נתמך. השתמש ב-JPG, PNG, WebP או PDF.')
          continue
        }
        if (file.size > MAX_SIZE) {
          setError('גודל הקובץ חורג מ-10 MB.')
          continue
        }
        const preview =
          file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : null
        toAdd.push({ id: crypto.randomUUID(), file, preview })
      }
      if (toAdd.length) onChange([...value, ...toAdd])
    },
    [value, onChange],
  )

  function removeFile(id: string) {
    const removed = value.find((f) => f.id === id)
    if (removed?.preview) URL.revokeObjectURL(removed.preview)
    onChange(value.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-accent'
            : 'border-border hover:border-primary/50 hover:bg-accent/50',
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        role="button"
        tabIndex={0}
        aria-label="העלה קבצים"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">
          גרור קבצים לכאן או לחץ לבחירה
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          תמונות (JPG, PNG, WebP) ו-PDF • עד 10 MB לקובץ
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Preview list */}
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card"
            >
              {f.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.preview}
                  alt={f.file.name}
                  className="size-10 rounded object-cover shrink-0"
                />
              ) : (
                <div className="size-10 rounded bg-muted flex items-center justify-center shrink-0">
                  {f.file.type === 'application/pdf' ? (
                    <FileText className="size-5 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="size-5 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(f.file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeFile(f.id)}
                aria-label="הסר קובץ"
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
