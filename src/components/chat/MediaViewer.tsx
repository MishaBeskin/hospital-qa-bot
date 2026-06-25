import { FileText, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import type { QAMedia } from '@/types'

interface MediaViewerProps {
  media: QAMedia[]
}

export function MediaViewer({ media }: MediaViewerProps) {
  if (!media.length) return null

  const images = media.filter((m) => m.file_type === 'image')
  const pdfs = media.filter((m) => m.file_type === 'pdf')

  return (
    <div className="mt-3 space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((item) => (
            <a
              key={item.id}
              href={item.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
            >
              <Image
                src={item.file_url}
                alt="קובץ מצורף"
                width={240}
                height={160}
                className="object-cover"
              />
            </a>
          ))}
        </div>
      )}

      {pdfs.length > 0 && (
        <div className="flex flex-col gap-2">
          {pdfs.map((item) => (
            <a
              key={item.id}
              href={item.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <FileText className="size-4 shrink-0" />
              <span>{item.file_url.split('/').pop() ?? 'מסמך PDF'}</span>
              <ExternalLink className="size-3 shrink-0 opacity-60" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
