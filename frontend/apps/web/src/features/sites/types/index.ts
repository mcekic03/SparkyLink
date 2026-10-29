import { z } from 'zod'
import { Currency, moneyPairSchema } from '#/types/money'

/** Mirrors `App\Enums\SiteStatus`. */
export enum SiteStatus {
  Offer = 1,
  Open = 2,
  Closed = 3,
}

/** Mirrors `App\Enums\PaymentStatus` (computed from billed vs paid). */
export enum PaymentStatus {
  Unpaid = 1,
  PartiallyPaid = 2,
  Paid = 3,
}

/** Mirrors `App\Enums\ItemType`. */
export enum ItemType {
  Material = 1,
  Service = 2,
  Other = 3,
}

/** Mirrors `App\Enums\DocumentType`. */
export enum DocumentType {
  Offer = 1,
  FinalInvoice = 2,
}

/** Mirrors `App\Enums\ReceiptStatus`. */
export enum ReceiptStatus {
  Pending = 1,
  Fetched = 2,
  Failed = 3,
  Manual = 4,
}

/** `App\Enums\MediaType`: 1 image, 2 video. */
export enum MediaType {
  Image = 1,
  Video = 2,
}

/** Mirrors `App\Enums\FuseType`: karakteristika osigurača. */
export enum FuseType {
  B = 1,
  C = 2,
}

/** `App\Enums\FuseRating`: jačine koje se biraju, u amperima. */
export const FUSE_RATINGS = [6, 10, 16, 20, 25, 32] as const

/** Mirrors `App\Enums\FuseBoardTemplate`: četiri izgleda PDF-a rasporeda. */
export enum FuseBoardTemplate {
  Table = 1,
  Rail = 2,
  Cards = 3,
  Drawing = 4,
}

export const balanceSchema = z.object({
  amount: z.string(),
  currency: z.enum(Currency),
  other_amount: z.string().nullable(),
})

export const financialsSchema = z.object({
  billed: moneyPairSchema,
  costs: moneyPairSchema,
  profit: moneyPairSchema,
  paid: moneyPairSchema,
  balance: balanceSchema,
  payment_status: z.enum(PaymentStatus),
})

export type SiteFinancials = z.infer<typeof financialsSchema>

export const siteSchema = z.object({
  id: z.number(),
  status: z.enum(SiteStatus),
  status_label: z.string(),
  currency: z.enum(Currency),
  name: z.string(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  investor_name: z.string().nullable(),
  investor_phone: z.string().nullable(),
  investor_email: z.string().nullable(),
  investor_address: z.string().nullable(),
  description: z.string().nullable(),
  markup_percent: z.string().nullable().optional(),
  effective_markup_percent: z.string().optional(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  financials: financialsSchema.optional(),
  is_deleted: z.boolean(),
  created_at: z.string(),
})

export type Site = z.infer<typeof siteSchema>

export const summarySchema = financialsSchema.extend({
  currency: z.enum(Currency),
  exchange_rate_today: z.string().nullable(),
  materials: z.object({ purchase: moneyPairSchema, sale: moneyPairSchema, margin: moneyPairSchema }),
  services: z.object({ sale: moneyPairSchema }),
  other: z.object({ purchase: moneyPairSchema, sale: moneyPairSchema }),
  labor: z.object({ cost: moneyPairSchema, person_hours: z.string() }),
  /** Nabavno za sve stavke (materijal i ostalo), bez radnika. */
  items: z.object({ purchase: moneyPairSchema }),
})

export type SiteSummary = z.infer<typeof summarySchema>

export const siteItemSchema = z.object({
  id: z.number(),
  site_id: z.number(),
  receipt_id: z.number().nullable(),
  type: z.enum(ItemType),
  currency: z.enum(Currency),
  name: z.string(),
  unit: z.string(),
  quantity: z.string(),
  purchase_price: z.string(),
  sale_price: z.string(),
  exchange_rate: z.string(),
  purchase_total_rsd: z.string(),
  purchase_total_eur: z.string(),
  sale_total_rsd: z.string(),
  sale_total_eur: z.string(),
  note: z.string().nullable(),
  is_billable: z.boolean(),
  /** Uvezeno iz Excel-a: nabavna je jednaka ceni za investitora dok se ne upiše prava. */
  is_purchase_estimated: z.boolean(),
  /** Uvoz iz Excel fajla iz kog je stavka; lista stavki šalje i ime fajla. */
  item_import_id: z.number().nullable(),
  item_import: z.object({ id: z.number(), file_name: z.string(), created_at: z.string() }).nullable().optional(),
  occurred_at: z.string(),
})

export type SiteItem = z.infer<typeof siteItemSchema>

export const laborEntrySchema = z.object({
  id: z.number(),
  site_id: z.number(),
  currency: z.enum(Currency),
  workers_count: z.number(),
  hours: z.string(),
  hourly_rate: z.string(),
  exchange_rate: z.string(),
  total_rsd: z.string(),
  total_eur: z.string(),
  description: z.string().nullable(),
  worked_at: z.string(),
})

export type LaborEntry = z.infer<typeof laborEntrySchema>

export const paymentSchema = z.object({
  id: z.number(),
  site_id: z.number(),
  currency: z.enum(Currency),
  amount: z.string(),
  exchange_rate: z.string(),
  amount_rsd: z.string(),
  amount_eur: z.string(),
  note: z.string().nullable(),
  paid_at: z.string(),
})

export type Payment = z.infer<typeof paymentSchema>

export const noteSchema = z.object({
  id: z.number(),
  site_id: z.number(),
  body: z.string(),
  author: z.string().nullable().optional(),
  created_at: z.string(),
})

export type SiteNote = z.infer<typeof noteSchema>

export const mediaSchema = z.object({
  id: z.number(),
  site_id: z.number(),
  type: z.enum(MediaType),
  original_name: z.string(),
  mime_type: z.string(),
  size: z.number(),
  caption: z.string().nullable(),
  author: z.string().nullable().optional(),
  url: z.string(),
  thumbnail_url: z.string().nullable(),
  created_at: z.string(),
})

export type SiteMedia = z.infer<typeof mediaSchema>

export const receiptItemDataSchema = z.object({
  name: z.string(),
  quantity: z.string(),
  unit: z.string(),
  unit_price: z.string(),
  total: z.string(),
})

export const receiptSchema = z.object({
  id: z.number(),
  site_id: z.number(),
  site_name: z.string().nullable().optional(),
  status: z.enum(ReceiptStatus),
  status_label: z.string(),
  qr_url: z.string().nullable(),
  store_name: z.string().nullable(),
  store_tin: z.string().nullable(),
  store_address: z.string().nullable(),
  store_city: z.string().nullable(),
  receipt_number: z.string().nullable(),
  total_amount: z.string().nullable(),
  note: z.string().nullable(),
  fetch_error: z.string().nullable(),
  items_count: z.number().optional(),
  journal: z.string().nullable().optional(),
  items_data: z.array(receiptItemDataSchema).nullable().optional(),
  photo_url: z.string().nullable(),
  copy_url: z.string(),
  issued_at: z.string().nullable(),
  created_at: z.string(),
})

export type Receipt = z.infer<typeof receiptSchema>

/** One line of the preview: what the receipt says, plus the suggested sale price. */
export const previewItemSchema = z.object({
  type: z.enum(ItemType),
  name: z.string(),
  unit: z.string(),
  quantity: z.string(),
  purchase_price: z.string(),
  sale_price: z.string(),
  total: z.string(),
  is_billable: z.boolean(),
})

export type PreviewItem = z.infer<typeof previewItemSchema>

export const receiptPreviewSchema = z.object({
  fetched: z.boolean(),
  qr_url: z.string(),
  message: z.string().optional(),
  markup_percent: z.string().optional(),
  receipt: z
    .object({
      store_name: z.string(),
      store_tin: z.string().nullable(),
      store_address: z.string().nullable(),
      store_city: z.string().nullable(),
      receipt_number: z.string().nullable(),
      total_amount: z.string(),
      issued_at: z.string().nullable(),
      items: z.array(previewItemSchema),
    })
    .optional(),
})

export type ReceiptPreview = z.infer<typeof receiptPreviewSchema>

/** Jedan red stavke iz Excel fajla prodavnice; cene su u dinarima. */
export const spreadsheetItemSchema = z.object({
  name: z.string(),
  unit: z.string(),
  quantity: z.string(),
  unit_price: z.string(),
  total: z.string(),
})

export type SpreadsheetItem = z.infer<typeof spreadsheetItemSchema>

/** Raniji uvoz sa kojim fajl deli stavke: šta bi bilo isto, izmenjeno i novo, red po red. */
export const spreadsheetCandidateSchema = z.object({
  import_id: z.number(),
  file_name: z.string(),
  created_at: z.string(),
  same: z.number(),
  changed: z.number(),
  new: z.number(),
  missing: z.number(),
  rows: z.array(
    z.object({
      status: z.enum(['same', 'changed', 'new']),
      item_id: z.number().nullable(),
      previous: z.object({ quantity: z.string(), unit: z.string(), sale_price: z.string() }).nullable(),
    }),
  ),
})

export type SpreadsheetCandidate = z.infer<typeof spreadsheetCandidateSchema>

/** Šta je dao svaki poslati fajl: njegove stavke ili razlog zašto nijedna nije pročitana. */
export const spreadsheetPreviewSchema = z.object({
  files: z.array(
    z.object({
      name: z.string(),
      items: z.array(spreadsheetItemSchema),
      error: z.string().nullable(),
      candidates: z.array(spreadsheetCandidateSchema),
      /** Raniji uvoz čija je ovo verovatno nova verzija. */
      suggested_import_id: z.number().nullable(),
    }),
  ),
})

export type SpreadsheetPreview = z.infer<typeof spreadsheetPreviewSchema>

export type SpreadsheetFile = SpreadsheetPreview['files'][number]

/**
 * Ostavljeni redovi idu kao materijal, po fajlu (svaki fajl je jedan uvoz): cena iz fajla je
 * cena za investitora, nabavna je procena.
 */
export interface SpreadsheetImportPayload {
  occurred_at: string
  files: Array<{
    name: string
    /** Raniji uvoz čija je ovo nova verzija; bez njega fajl je nov dokument. */
    merge_into: number | null
    items: Array<{ name: string; unit: string; quantity: string; sale_price: string }>
  }>
}

/** Nabavna cena za izabrane stavke: procenat manje ili ukupno plaćeno u izabranoj valuti. */
export type PurchasePricesPayload =
  | { item_ids: number[]; percent: string }
  | { item_ids: number[]; total: string; currency: Currency }

export const purchasePricesResultSchema = z.object({
  count: z.number(),
  purchase: moneyPairSchema,
  sale: moneyPairSchema,
})

export const documentSchema = z.object({
  id: z.number(),
  site_id: z.number(),
  type: z.enum(DocumentType),
  type_label: z.string(),
  number: z.string(),
  currency: z.enum(Currency),
  exchange_rate: z.string(),
  total_amount: z.string(),
  paid_amount: z.string(),
  balance_amount: z.string(),
  is_itemized: z.boolean(),
  note: z.string().nullable(),
  pdf_url: z.string(),
  issued_at: z.string(),
})

export type SiteDocument = z.infer<typeof documentSchema>

export const fuseSchema = z.object({
  number: z.number(),
  name: z.string(),
  type: z.enum(FuseType),
  rating: z.number(),
})

export const fuseBoardSchema = z.object({
  id: z.number(),
  site_id: z.number(),
  name: z.string(),
  fuses: z.array(fuseSchema),
  pdf_urls: z.array(z.object({ template: z.enum(FuseBoardTemplate), url: z.string() })),
})

export type FuseBoard = z.infer<typeof fuseBoardSchema>

/** Bez `fuses` server menja samo naziv, a osigurači ostaju. */
export interface FuseBoardPayload {
  name: string
  fuses?: Array<{ name: string; type: FuseType; rating: number }>
}

export const suggestionSchema = z.object({
  source: z.enum(['price_list', 'history']),
  type: z.enum(ItemType),
  name: z.string(),
  unit: z.string(),
  currency: z.enum(Currency),
  purchase_price: z.string().nullable(),
  sale_price: z.string().nullable(),
})

export type ItemSuggestion = z.infer<typeof suggestionSchema>

/** Query parameters understood by `Site::filters()`. */
export interface SitesParams {
  page?: number
  search?: string
  status?: SiteStatus
  payment_status?: PaymentStatus
  trashed?: 1
}

/** Optional fields are sent as null when empty, so a cleared field clears. */
export interface SitePayload {
  status: SiteStatus
  currency: Currency
  name: string
  address: string | null
  city: string | null
  investor_name: string | null
  investor_phone: string | null
  investor_email: string | null
  investor_address: string | null
  description: string | null
  markup_percent: string | null
  started_at: string | null
  completed_at: string | null
}

export interface ItemPayload {
  type: ItemType
  currency: Currency
  name: string
  unit: string
  quantity: string
  purchase_price?: string
  sale_price?: string
  occurred_at: string
  exchange_rate?: string
  note?: string
  is_billable: boolean
  /** Zadrži procenu (nabavna = cena za investitora) umesto nabavne cene. */
  is_purchase_estimated?: boolean
}

export interface LaborPayload {
  currency: Currency
  workers_count: number
  hours: string
  hourly_rate: string
  worked_at: string
  exchange_rate?: string
  description?: string
}

export interface PaymentPayload {
  currency: Currency
  amount: string
  paid_at: string
  exchange_rate?: string
  note?: string
}

export interface ImportItem {
  type: ItemType
  name: string
  unit: string
  quantity: string
  purchase_price: string
  sale_price: string
  is_billable: boolean
}

export function parseSiteStatus(value: string | number | undefined): SiteStatus | undefined {
  const result = z.enum(SiteStatus).safeParse(Number(value))
  return result.success ? result.data : undefined
}

export function parsePaymentStatus(value: string | number | undefined): PaymentStatus | undefined {
  const result = z.enum(PaymentStatus).safeParse(Number(value))
  return result.success ? result.data : undefined
}

export function parseItemType(value: string | number | undefined): ItemType | undefined {
  const result = z.enum(ItemType).safeParse(Number(value))
  return result.success ? result.data : undefined
}
