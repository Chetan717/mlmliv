export const RANK_PROMOTION_TYPES = Object.freeze([
  "Rank_Promotion",
  "Rank_Promotion_B",
]);

const RANK_PROMOTION_TYPE_SET = new Set(RANK_PROMOTION_TYPES);

export function isRankPromotionType(type) {
  return RANK_PROMOTION_TYPE_SET.has(type);
}
