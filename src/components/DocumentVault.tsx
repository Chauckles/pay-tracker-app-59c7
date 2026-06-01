import { useRef, useState } from 'react'
import { Upload, FileText, Trash2, Download, FileImage, File, Lock } from 'lucide-react'
import type { Document } from '../lib/db'
import { format } from 'date-fns'

interface Props {
  documents: Document[]
  onAdd: (doc: Omit<Document, 'id' | 'addedAt'>) => Promise<Document>
  onDelete: (id: string) => void
}

const CATEGORIES = [
  { value: 'paystub', label: 'Pay Stub', color: 'text-emerald-400' },
  { value: 'contract', label: 'Contract', color: 'text-sky-400' },
  { value: 'tax', label: 'Tax Doc', color: 'text-amber-400' },
  { value: 'other', label: 'Other', color: 'text-slate-400' },
] as const

function fileIcon(type: string) {
  if (type.startsWith('image/')) return <FileImage className="w-5 h-5" />
  if (type === 'application/pdf') return <FileText className="w-5 h-5" />
  return <File className="w-5 h-5" />
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function DocumentVault({ documents, onAdd, onDelete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState<Document['category']>('paystub')
  const [filter, setFilter] = useState<Document['category'] | 'all'>('all')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const data = await file.arrayBuffer()
      await onAdd({ name: file.name, type: file.type, size: file.size, data, category })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDownload = (doc: Document) => {
    const blob = new Blob([doc.data], { type: doc.type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = documents.filter(d => filter === 'all' || d.category === filter)

  return (
    <div className="flex flex-col gap-4">
      {/* Header + upload */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-amber-400" />
          <h2 className="text-slate-200 font-semibold">Document Vault</h2>
        </div>
        <p className="text-slate-500 text-xs mb-4">
          Store pay stubs, contracts, and tax documents. Saved locally on your device.
        </p>

        {/* Category picker */}
        <div className="flex gap-2 flex-wrap mb-3">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === c.value
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700/50 text-slate-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <input ref={fileRef} type="file" className="hidden" onChange={handleFile}
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.txt" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 border-dashed rounded-xl py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Saving...' : `Upload ${CATEGORIES.find(c => c.value === category)?.label}`}
        </button>
      </div>

      {/* Filter tabs */}
      {documents.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', ...CATEGORIES.map(c => c.value)] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-slate-700 text-white' : 'text-slate-500'
              }`}
            >
              {f === 'all' ? 'All' : CATEGORIES.find(c => c.value === f)?.label}
            </button>
          ))}
        </div>
      )}

      {/* Document list */}
      {filtered.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 text-center">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No documents yet</p>
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-700/40">
            {filtered.map(doc => {
              const cat = CATEGORIES.find(c => c.value === doc.category)
              return (
                <div key={doc.id} className="p-4 flex items-center gap-3">
                  <div className="text-slate-400 shrink-0">
                    {fileIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className={cat?.color}>{cat?.label}</span>
                      {' · '}{formatSize(doc.size)}
                      {' · '}{format(new Date(doc.addedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(doc.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
