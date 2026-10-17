import { useEffect, useState } from 'react'

// 사진은 용량이 커서 localStorage 대신 IndexedDB에 Blob으로 저장
const DB_NAME = 'm100'
const STORE = 'photos'

let dbPromise: Promise<IDBDatabase> | null = null

function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  const d = await db()
  return new Promise<T>((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const listeners = new Set<() => void>()
let version = 0
const bump = () => {
  version++
  listeners.forEach((l) => l())
}

export const putPhoto = (id: number, blob: Blob) => tx('readwrite', (s) => s.put(blob, id)).then(bump)
export const getPhoto = (id: number) => tx<Blob | undefined>('readonly', (s) => s.get(id))
export const deletePhoto = (id: number) => tx('readwrite', (s) => s.delete(id)).then(bump)
export const clearPhotos = () => tx('readwrite', (s) => s.clear()).then(bump)

export async function allPhotos() {
  const keys = await tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys())
  const out: [number, Blob][] = []
  for (const k of keys) {
    const b = await getPhoto(Number(k))
    if (b) out.push([Number(k), b])
  }
  return out
}

export function usePhotoUrl(id: number) {
  const [url, setUrl] = useState<string>()
  const [v, setV] = useState(version)
  useEffect(() => {
    const l = () => setV(version)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  useEffect(() => {
    let objectUrl: string | undefined
    let alive = true
    getPhoto(id)
      .then((b) => {
        if (!alive) return
        objectUrl = b ? URL.createObjectURL(b) : undefined
        setUrl(objectUrl)
      })
      .catch(() => setUrl(undefined))
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id, v])
  return url
}

// 폰 사진은 수 MB라서 긴 변 1600px JPEG로 줄여서 저장
export async function resizeImage(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('사진 변환 실패'))), 'image/jpeg', 0.85),
  )
}

export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(b)
  })

export const dataUrlToBlob = (url: string) => fetch(url).then((r) => r.blob())
