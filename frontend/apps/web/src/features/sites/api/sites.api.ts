import { z } from 'zod'
import { api } from '#/lib/api'
import { messageResponseSchema, paginationSchema } from '#/types/api'
import type { PaginatedResponse } from '#/types/api'
import {
  documentSchema,
  laborEntrySchema,
  mediaSchema,
  noteSchema,
  paymentSchema,
  purchasePricesResultSchema,
  receiptPreviewSchema,
  receiptSchema,
  siteItemSchema,
  siteSchema,
  spreadsheetPreviewSchema,
  suggestionSchema,
  summarySchema,
} from '../types'
import type {
  DocumentType,
  ImportItem,
  ItemPayload,
  ItemSuggestion,
  ItemType,
  LaborEntry,
  LaborPayload,
  Payment,
  PaymentPayload,
  PurchasePricesPayload,
  Receipt,
  ReceiptPreview,
  Site,
  SiteDocument,
  SiteItem,
  SiteMedia,
  SiteNote,
  SitePayload,
  SiteSummary,
  SitesParams,
  SpreadsheetImportPayload,
  SpreadsheetPreview,
} from '../types'

// Responses are parsed, not asserted: `api.get<T>()` checks nothing at runtime.

const ADMIN = '/api/admin'

function dataOf<T extends z.ZodType>(schema: T) {
  return z.object({ message: z.string().optional(), data: schema })
}

const sitesResponseSchema = z.object({ data: z.array(siteSchema), pagination: paginationSchema })

// ===== Gradilista =====

export async function fetchSites(params: SitesParams): Promise<PaginatedResponse<Site>> {
  const response = await api.get<unknown>(`${ADMIN}/sites`, { params })
  return sitesResponseSchema.parse(response.data)
}

export async function fetchSite(id: number): Promise<Site> {
  const response = await api.get<unknown>(`${ADMIN}/sites/${id}`)
  return dataOf(siteSchema).parse(response.data).data
}

export async function createSite(payload: SitePayload) {
  const response = await api.post<unknown>(`${ADMIN}/sites`, payload)
  return dataOf(siteSchema).parse(response.data)
}

export async function updateSite(id: number, payload: SitePayload) {
  const response = await api.put<unknown>(`${ADMIN}/sites/${id}`, payload)
  return dataOf(siteSchema).parse(response.data)
}

export async function deleteSite(id: number) {
  const response = await api.delete<unknown>(`${ADMIN}/sites/${id}`)
  return messageResponseSchema.parse(response.data)
}

export async function restoreSite(id: number) {
  const response = await api.post<unknown>(`${ADMIN}/sites/${id}/restore`)
  return messageResponseSchema.parse(response.data)
}

export async function fetchSiteSummary(id: number): Promise<SiteSummary> {
  const response = await api.get<unknown>(`${ADMIN}/sites/${id}/summary`)
  return dataOf(summarySchema).parse(response.data).data
}

// ===== Stavke =====

export async function fetchItems(siteId: number, type?: ItemType): Promise<SiteItem[]> {
  const response = await api.get<unknown>(`${ADMIN}/sites/${siteId}/items`, { params: { type } })
  return dataOf(z.array(siteItemSchema)).parse(response.data).data
}

export async function saveItem(siteId: number, payload: ItemPayload, id?: number) {
  const response = id
    ? await api.put<unknown>(`${ADMIN}/items/${id}`, payload)
    : await api.post<unknown>(`${ADMIN}/sites/${siteId}/items`, payload)
  return dataOf(siteItemSchema).parse(response.data)
}

export async function deleteItem(id: number) {
  const response = await api.delete<unknown>(`${ADMIN}/items/${id}`)
  return messageResponseSchema.parse(response.data)
}

/** Čita tabelu stavki sa prvog lista svakog fajla prodavnice; ništa se još ne čuva. */
export async function readSpreadsheets(siteId: number, files: File[]): Promise<SpreadsheetPreview> {
  const form = new FormData()
  for (const file of files) form.append('files[]', file, file.name)

  const response = await api.post<unknown>(`${ADMIN}/sites/${siteId}/items/spreadsheets`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return dataOf(spreadsheetPreviewSchema).parse(response.data).data
}

export async function importSpreadsheetItems(siteId: number, payload: SpreadsheetImportPayload) {
  const response = await api.post<unknown>(`${ADMIN}/sites/${siteId}/items/import`, payload)
  return messageResponseSchema.parse(response.data)
}

/** Nabavna cena za više stavki odjednom; cene za investitora ostaju iste. */
export async function setPurchasePrices(siteId: number, payload: PurchasePricesPayload) {
  const response = await api.post<unknown>(`${ADMIN}/sites/${siteId}/items/purchase-prices`, payload)
  return dataOf(purchasePricesResultSchema).parse(response.data)
}

export async function fetchSuggestions(search: string, type?: ItemType): Promise<ItemSuggestion[]> {
  const response = await api.get<unknown>(`${ADMIN}/item-suggestions`, { params: { search, type } })
  return dataOf(z.array(suggestionSchema)).parse(response.data).data
}

/** NBS middle rate for a day (`yyyy-mm-dd`); 422 when it is not available. */
export async function fetchExchangeRate(day: string): Promise<string> {
  const response = await api.get<unknown>(`${ADMIN}/exchange-rates/${day}`)
  return dataOf(z.object({ rate: z.string() })).parse(response.data).data.rate
}

// ===== Radnici =====

export async function fetchLabor(siteId: number): Promise<LaborEntry[]> {
  const response = await api.get<unknown>(`${ADMIN}/sites/${siteId}/labor-entries`)
  return dataOf(z.array(laborEntrySchema)).parse(response.data).data
}

export async function saveLabor(siteId: number, payload: LaborPayload, id?: number) {
  const response = id
    ? await api.put<unknown>(`${ADMIN}/labor-entries/${id}`, payload)
    : await api.post<unknown>(`${ADMIN}/sites/${siteId}/labor-entries`, payload)
  return dataOf(laborEntrySchema).parse(response.data)
}

export async function deleteLabor(id: number) {
  const response = await api.delete<unknown>(`${ADMIN}/labor-entries/${id}`)
  return messageResponseSchema.parse(response.data)
}

// ===== Uplate =====

export async function fetchPayments(siteId: number): Promise<Payment[]> {
  const response = await api.get<unknown>(`${ADMIN}/sites/${siteId}/payments`)
  return dataOf(z.array(paymentSchema)).parse(response.data).data
}

export async function savePayment(siteId: number, payload: PaymentPayload, id?: number) {
  const response = id
    ? await api.put<unknown>(`${ADMIN}/payments/${id}`, payload)
    : await api.post<unknown>(`${ADMIN}/sites/${siteId}/payments`, payload)
  return dataOf(paymentSchema).parse(response.data)
}

export async function deletePayment(id: number) {
  const response = await api.delete<unknown>(`${ADMIN}/payments/${id}`)
  return messageResponseSchema.parse(response.data)
}

// ===== Dokumenti (ponuda, zavrsni racun) =====

export async function fetchDocuments(siteId: number): Promise<SiteDocument[]> {
  const response = await api.get<unknown>(`${ADMIN}/sites/${siteId}/documents`)
  return dataOf(z.array(documentSchema)).parse(response.data).data
}

export async function createDocument(
  siteId: number,
  payload: { type: DocumentType; issued_at: string; note?: string; is_itemized: boolean },
) {
  const response = await api.post<unknown>(`${ADMIN}/sites/${siteId}/documents`, payload)
  return dataOf(documentSchema).parse(response.data)
}

export async function deleteDocument(id: number) {
  const response = await api.delete<unknown>(`${ADMIN}/documents/${id}`)
  return messageResponseSchema.parse(response.data)
}

// ===== Napomene =====

export async function fetchNotes(siteId: number): Promise<SiteNote[]> {
  const response = await api.get<unknown>(`${ADMIN}/sites/${siteId}/notes`)
  return dataOf(z.array(noteSchema)).parse(response.data).data
}

export async function saveNote(siteId: number, body: string, id?: number) {
  const response = id
    ? await api.put<unknown>(`${ADMIN}/notes/${id}`, { body })
    : await api.post<unknown>(`${ADMIN}/sites/${siteId}/notes`, { body })
  return dataOf(noteSchema).parse(response.data)
}

export async function deleteNote(id: number) {
  const response = await api.delete<unknown>(`${ADMIN}/notes/${id}`)
  return messageResponseSchema.parse(response.data)
}

// ===== Slike i video =====

export async function fetchMedia(siteId: number): Promise<SiteMedia[]> {
  const response = await api.get<unknown>(`${ADMIN}/sites/${siteId}/media`)
  return dataOf(z.array(mediaSchema)).parse(response.data).data
}

export async function uploadMedia(
  siteId: number,
  file: Blob,
  fileName: string,
  options: { thumbnail?: Blob; caption?: string; takenAt?: string; onProgress?: (fraction: number) => void },
) {
  const form = new FormData()
  form.append('file', file, fileName)
  if (options.thumbnail) form.append('thumbnail', options.thumbnail, 'thumbnail.jpg')
  if (options.caption) form.append('caption', options.caption)
  if (options.takenAt) form.append('taken_at', options.takenAt)

  const response = await api.post<unknown>(`${ADMIN}/sites/${siteId}/media`, form, {
    // multipart: axios drops the JSON default and the browser adds the boundary.
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (event) => {
      if (event.total) options.onProgress?.(event.loaded / event.total)
    },
  })
  return dataOf(mediaSchema).parse(response.data)
}

export async function updateMediaCaption(id: number, caption: string) {
  const response = await api.put<unknown>(`${ADMIN}/media/${id}`, { caption })
  return dataOf(mediaSchema).parse(response.data)
}

export async function deleteMedia(id: number) {
  const response = await api.delete<unknown>(`${ADMIN}/media/${id}`)
  return messageResponseSchema.parse(response.data)
}

// ===== Fiskalni racuni =====

export async function fetchSiteReceipts(siteId: number): Promise<Receipt[]> {
  const response = await api.get<unknown>(`${ADMIN}/sites/${siteId}/receipts`)
  return dataOf(z.array(receiptSchema)).parse(response.data).data
}

export async function fetchReceipt(id: number): Promise<Receipt> {
  const response = await api.get<unknown>(`${ADMIN}/receipts/${id}`)
  return dataOf(receiptSchema).parse(response.data).data
}

export async function previewReceipt(siteId: number, qrUrl: string): Promise<ReceiptPreview> {
  const response = await api.post<unknown>(`${ADMIN}/sites/${siteId}/receipts/preview`, {
    qr_url: qrUrl,
    transliterate: true,
  })
  return dataOf(receiptPreviewSchema).parse(response.data).data
}

export async function storeReceipt(
  siteId: number,
  payload: { qrUrl?: string; items?: ImportItem[]; photo?: Blob; note?: string; storeName?: string; issuedAt?: string },
) {
  const form = new FormData()
  if (payload.qrUrl) form.append('qr_url', payload.qrUrl)
  if (payload.photo) form.append('photo', payload.photo, 'racun.jpg')
  if (payload.note) form.append('note', payload.note)
  if (payload.storeName) form.append('store_name', payload.storeName)
  if (payload.issuedAt) form.append('issued_at', payload.issuedAt)

  for (const [index, item] of (payload.items ?? []).entries()) {
    form.append(`items[${index}][type]`, String(item.type))
    form.append(`items[${index}][name]`, item.name)
    form.append(`items[${index}][unit]`, item.unit)
    form.append(`items[${index}][quantity]`, item.quantity)
    form.append(`items[${index}][purchase_price]`, item.purchase_price)
    form.append(`items[${index}][sale_price]`, item.sale_price)
    form.append(`items[${index}][is_billable]`, item.is_billable ? '1' : '0')
  }

  const response = await api.post<unknown>(`${ADMIN}/sites/${siteId}/receipts`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return dataOf(receiptSchema).parse(response.data)
}

export async function refetchReceipt(id: number) {
  const response = await api.post<unknown>(`${ADMIN}/receipts/${id}/refetch`)
  return dataOf(receiptSchema).parse(response.data)
}

export async function importReceiptItems(id: number, items: ImportItem[]) {
  const response = await api.post<unknown>(`${ADMIN}/receipts/${id}/items`, {
    items: items.map((item) => ({ ...item, is_billable: item.is_billable })),
  })
  return messageResponseSchema.parse(response.data)
}

export async function deleteReceipt(id: number) {
  const response = await api.delete<unknown>(`${ADMIN}/receipts/${id}`)
  return messageResponseSchema.parse(response.data)
}

// ===== Podrazumevane vrednosti iz podesavanja (valuta, marza) =====

const defaultsSchema = z.object({
  default_currency: z.number().optional(),
  default_markup_percent: z.string().optional(),
  company_name: z.string(),
})

export async function fetchSiteDefaults() {
  const response = await api.get<unknown>(`${ADMIN}/settings`)
  return dataOf(defaultsSchema).parse(response.data).data
}
