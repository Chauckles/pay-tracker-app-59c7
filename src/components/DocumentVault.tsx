import { useRef, useState } from 'react'
import { Upload, FileText, Trash2, Download, FileImage, File, Lock, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react'
import type { Document, DocCategory } from '../lib/db'
import { format } from 'date-fns'

interface Props {
  userId: string
  documents: Document[]
  onAdd: (doc: Omit<Document, 'id' | 'addedAt'>) => Promise<Document>
  onDelete: (id: string) => void
}

const DOC_TYPES: { value: DocCategory; label: string; color: string; description: string }[] = [
  { value: 'w2',               label: 'W-2',             color: 'text-emerald-400', description: 'Wage & Tax Statement' },
  { value: 'w4',               label: 'W-4',             color: 'text-sky-400',     description: 'Withholding Certificate' },
  { value: 'i9',               label: 'I-9',             color: 'text-violet-400',  description: 'Employment Eligibility' },
  { value: 'offer-letter',     label: 'Offer Letter',    color: 'text-amber-400',   description: 'Employment Offer' },
  { value: 'paystub',          label: 'Pay Stub',        color: 'text-emerald-400', description: 'Earnings Statement' },
  { value: '1099',             label: '1099',            color: 'text-orange-400',  description: 'Non-Employee Compensation' },
  { value: 'contract',         label: 'Contract',        color: 'text-pink-400',    description: 'Employment Agreement' },
  { value: 'background-check', label: 'Background Check',color: 'text-slate-400',   description: 'Screening Report' },
  { value: 'other',            label: 'Other',           color: 'text-slate-400',   description: 'Other Documents' },
]

function fileIcon(type: string) {
  if (type.startsWith('image/')) return <FileImage className="w-4 h-4" />
  if (type === 'application/pdf') return <FileText className="w-4 h-4" />
  return <File className="w-4 h-4" />
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function groupByYear(docs: Document[]): Record<number, Document[]> {
  const out: Record<number, Document[]> = {}
  for (const d of docs) {
    if (!out[d.year]) out[d.year] = []
    out[d.year].push(d)
  }
  return out
}

interface YearFolderProps {
  year: number
  docs: Document[]
  onDelete: (id: string) => void
  onDownload: (doc: Document) => void
  defaultOpen: boolean
}

function YearFolder({ year, docs, onDelete, onDownload, defaultOpen }: YearFolderProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [activeType, setActiveType] = useState<DocCategory | 'all'>('all')

  const typesWithDocs = DOC_TYPES.filter(t => docs.some(d => d.category === t.value))
  const filtered = activeType === 'all' ? docs : docs.filter(d => d.category === activeType)

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <FolderOpen className="w-5 h-5 text-amber-400 shrink-0" />
        <span className="font-semibold text-white flex-1">{year}</span>
        <span className="text-xs text-slate-500 mr-2">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <>
          {/* Type tabs */}
          {typesWithDocs.length > 1 && (
            <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
              <button
                onClick={() => setActiveType('all')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeType === 'all' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                All
              </button>
              {typesWithDocs.map(t => (
                <button
                  key={t.value}
                  onClick={() => setActiveType(t.value)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeType === t.value ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Doc list */}
          <div className="divide-y divide-slate-700/40 border-t border-slate-700/40">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">No documents</div>
            ) : filtered.map(doc => {
              const cat = DOC_TYPES.find(t => t.value === doc.category)
              return (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`shrink-0 ${cat?.color ?? 'text-slate-400'}`}>
                    {fileIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className={cat?.color}>{cat?.label}</span>
                      {' · '}{formatSize(doc.size)}
                      {' · '}{format(new Date(doc.addedAt), 'MMM d')}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => onDownload(doc)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(doc.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function DocumentVault({ userId, documents, onAdd, onDelete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState<DocCategory>('paystub')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const data = await file.arrayBuffer()
      await onAdd({ name: file.name, type: file.type, size: file.size, data, category, year: selectedYear, userId })
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

  const byYear = groupByYear(documents)
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)
  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="flex flex-col gap-4">
      {/* Upload card */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-amber-400" />
          <h2 className="text-slate-200 font-semibold">Document Vault</h2>
        </div>
        <p className="text-slate-500 text-xs mb-4">Stored locally on your device. Organized by year and document type.</p>

        {/* Year selector */}
        <div className="mb-3">
          <label className="text-xs text-slate-400 block mb-1.5">Year</label>
          <div className="flex gap-2">
            {yearOptions.map(y => (
              <button key={y} onClick={() => setSelectedYear(y)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${selectedYear === y ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400' : 'bg-slate-700/50 text-slate-400'}`}>
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Doc type */}
        <div className="mb-3">
          <label className="text-xs text-slate-400 block mb-1.5">Document type</label>
          <div className="grid grid-cols-3 gap-1.5">
            {DOC_TYPES.map(t => (
              <button key={t.value} onClick={() => setCategory(t.value)}
                className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors text-center ${category === t.value ? 'bg-slate-600 text-white' : 'bg-slate-700/50 text-slate-400'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <input ref={fileRef} type="file" className="hidden" onChange={handleFile}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt,.gif" />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 border-dashed rounded-xl py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors">
          <Upload className="w-4 h-4" />
          {uploading ? 'Saving...' : `Upload ${DOC_TYPES.find(t => t.value === category)?.label ?? 'Document'} (${selectedYear})`}
        </button>
      </div>

      {/* Year folders */}
      {years.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 text-center">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No documents yet</p>
          <p className="text-slate-600 text-xs mt-1">Upload your first document above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {years.map(year => (
            <YearFolder
              key={year}
              year={year}
              docs={byYear[year]}
              onDelete={onDelete}
              onDownload={handleDownload}
              defaultOpen={year === currentYear}
            />
          ))}
        </div>
      )}
    </div>
  )
}
