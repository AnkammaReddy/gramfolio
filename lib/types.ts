export type Category = "Coin" | "Bar" | "Jewellery"
export type CashbackStatus = "Pending" | "Credited" | "Missing"
export type GraphMode = "purchase" | "effective"
export type RewardType = "GiftVoucher" | "Cashback" | "RewardPoints" | "SuperCoins" | "Coupon"

export const REWARD_TYPES: { value: RewardType; label: string }[] = [
  { value: "GiftVoucher", label: "Gift Voucher" },
  { value: "Cashback", label: "Cashback" },
  { value: "RewardPoints", label: "Reward Points" },
  { value: "SuperCoins", label: "SuperCoins" },
  { value: "Coupon", label: "Coupon" },
]

export const PAYMENT_METHODS = ["Credit Card", "Debit Card", "UPI", "Cash", "Net Banking", "Gift Voucher"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const WEBSITES = ["Flipkart", "Ajio", "Myntra", "Amazon", "Tata CLiQ", "Other"]
export const BRANDS = ["Tanishq", "Kalyan", "Malabar", "Bhima", "Muthoot", "Joyalukkas", "MMTC-PAMP", "Other"]
export { PURITY_PRESETS, PURITIES, PURITY_LABELS } from "./purity"
export const CATEGORIES: Category[] = ["Coin", "Bar", "Jewellery"]
export const CASHBACK_STATUSES: CashbackStatus[] = ["Pending", "Credited", "Missing"]

// Plain-serializable purchase used across client components.
export type PurchaseDTO = {
  id: number
  assetType: string
  purchaseDate: string
  deliveredDate: string | null
  website: string | null
  merchant: string | null
  brand: string | null
  category: string
  purity: string
  weightGrams: number
  quantity: number
  purchasePrice: number
  pricePerGram: number
  remarks: string | null
  creditCard: string | null
  paymentMethod: string | null
  rewardStrategy: string | null
  rewardPercentage: number
  rewardPointsExpected: number
  rewardValue: number
  pointsPerMultiple: number
  pointsMultiple: number
  pointsBaseValue: number
  pointsTransferMultiplier: number
  pointsTransferPartner: string | null
  pointsReceived: number
  pointsCreditedDate: string | null
  pointsStatus: string
  pointsVerified: boolean
  giftVoucherSavings: number
  vouchersJson: string | null
  superCoinsValue: number
  couponSavings: number
  cashbackExpected: number
  cashbackReceived: number
  effectiveCost: number
  effectivePricePerGram: number
  cashbackCreditedDate: string | null
  cashbackStatus: CashbackStatus
  verified: boolean
  notes: string | null
  tags: string[]
  createdAt: string
  listedPrice: number | null
  platformDiscount: number | null
  bankInstantDiscount: number | null
  platformCharges: number | null
}

export type RewardComponentDTO = {
  id: number
  purchaseId: number
  type: RewardType
  label: string | null
  amount: number
  quantity: number
  percentage: number
  expected: number
  received: number
  description: string | null
  // Voucher-specific
  faceValue: number
  amountPaid: number
  cardUsed: string | null
  rewardType: string
  // RewardPoints-specific
  pointsEarned: number
  pointsPerMultiple: number
  pointsMultiple: number
  basePointValue: number
  transferMultiplier: number
  transferPartner: string | null
  pointsStatus: string
  pointsVerified: boolean
}

export type GoldPriceDTO = {
  id: number
  assetType: string
  priceDate: string
  purity: string
  pricePerGram: number
  source: string | null
  remarks: string | null
}

export type SettingsDTO = {
  currency: string
  graphMode: GraphMode
  defaultDateRange: string
  theme: string
  displayName: string | null
}

export type MessageSenderRole = "member" | "admin"

export type MessageDTO = {
  id: number
  conversationId: number
  senderRole: MessageSenderRole
  body: string
  createdAt: string
  readAt: string | null
  isMine: boolean
}

export type ConversationDTO = {
  id: number
  userId: string
  userName: string | null
  userEmail: string | null
  lastMessageAt: string
  unreadCount: number
}
