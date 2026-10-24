import { CookingMethod, FoodItem, FoodState, UserProfile } from '~/types';

export interface MacroPer100g {
  keywords: string[];
  nameEn: string;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  fiber: number;
  defaultUnitGrams: number; // Khối lượng mặc định cho "1 phần / 1 cái / 1 bát / 1 quả"
  isLiquid?: boolean;
  rawToCookedRatio?: number; // Tỷ lệ mật độ dinh dưỡng khi cân sống so với chín (VD thịt sống nhiều nước hơn thịt chín -> 0.75)
}

/**
 * Cơ sở dữ liệu dinh dưỡng chuẩn (tính trên 100g ở trạng thái ĐÃ NẤU CHÍN / SẴN SÀNG ĂN)
 * Kết hợp dữ liệu Viện Dinh dưỡng Việt Nam & USDA
 */
const FOOD_DATABASE: MacroPer100g[] = [
  // === NHÓM TINH BỘT / CƠM / BÚN / PHỞ ===
  {
    keywords: ['cơm gạo lứt', 'gạo lứt', 'brown rice'],
    nameEn: 'brown rice',
    calories: 112,
    protein: 2.6,
    carb: 23.5,
    fat: 0.9,
    fiber: 1.8,
    defaultUnitGrams: 160,
    rawToCookedRatio: 3.1,
  },
  {
    keywords: ['cơm tấm', 'cơm sườn'],
    nameEn: 'broken rice with pork',
    calories: 185,
    protein: 9.5,
    carb: 26.0,
    fat: 4.8,
    fiber: 0.8,
    defaultUnitGrams: 350,
  },
  {
    keywords: ['cơm chiên', 'cơm rang', 'fried rice'],
    nameEn: 'fried rice',
    calories: 175,
    protein: 5.5,
    carb: 25.0,
    fat: 6.0,
    fiber: 1.0,
    defaultUnitGrams: 250,
  },
  {
    keywords: ['cơm trắng', 'cơm', 'white rice', 'rice'],
    nameEn: 'white rice',
    calories: 130,
    protein: 2.7,
    carb: 28.2,
    fat: 0.3,
    fiber: 0.4,
    defaultUnitGrams: 160, // 1 bát cơm vừa ~ 160g (~208 kcal)
    rawToCookedRatio: 2.8,
  },
  {
    keywords: ['xôi xéo', 'xôi mặn', 'xôi gà', 'xôi đậu', 'xôi'],
    nameEn: 'sticky rice',
    calories: 215,
    protein: 4.8,
    carb: 41.0,
    fat: 3.5,
    fiber: 1.2,
    defaultUnitGrams: 200,
  },
  {
    keywords: ['cháo thịt', 'cháo gà', 'cháo cá', 'cháo sườn', 'cháo'],
    nameEn: 'porridge',
    calories: 68,
    protein: 3.2,
    carb: 11.0,
    fat: 1.2,
    fiber: 0.3,
    defaultUnitGrams: 350,
  },
  {
    keywords: ['phở bò', 'phở tái', 'phở nạm', 'beef pho'],
    nameEn: 'beef pho',
    calories: 105,
    protein: 6.2,
    carb: 14.0,
    fat: 2.6,
    fiber: 0.6,
    defaultUnitGrams: 480, // 1 tô phở ~ 500 kcal
  },
  {
    keywords: ['phở gà', 'chicken pho', 'phở'],
    nameEn: 'chicken pho',
    calories: 98,
    protein: 6.5,
    carb: 13.5,
    fat: 2.0,
    fiber: 0.6,
    defaultUnitGrams: 450,
  },
  {
    keywords: ['bún bò huế', 'bún bò'],
    nameEn: 'bun bo hue',
    calories: 118,
    protein: 6.8,
    carb: 14.5,
    fat: 3.6,
    fiber: 0.8,
    defaultUnitGrams: 500,
  },
  {
    keywords: ['bún chả', 'bún thịt nướng'],
    nameEn: 'bun cha / grilled pork vermicelli',
    calories: 142,
    protein: 7.5,
    carb: 16.5,
    fat: 5.0,
    fiber: 1.2,
    defaultUnitGrams: 400,
  },
  {
    keywords: ['bún riêu', 'bún cá', 'bún mọc', 'bún măng', 'hủ tiếu'],
    nameEn: 'noodle soup',
    calories: 102,
    protein: 5.5,
    carb: 14.0,
    fat: 2.5,
    fiber: 0.8,
    defaultUnitGrams: 450,
  },
  {
    keywords: ['bún tươi', 'bún trắng', 'bún', 'phở cuốn'],
    nameEn: 'rice vermicelli',
    calories: 110,
    protein: 1.8,
    carb: 25.0,
    fat: 0.2,
    fiber: 0.5,
    defaultUnitGrams: 150,
  },
  {
    keywords: ['miến gà', 'miến trộn', 'miến'],
    nameEn: 'glass noodles',
    calories: 108,
    protein: 4.5,
    carb: 19.0,
    fat: 1.5,
    fiber: 0.9,
    defaultUnitGrams: 350,
  },
  {
    keywords: ['mì tôm', 'mì gói', 'mì ăn liền', 'instant noodles'],
    nameEn: 'instant noodles',
    calories: 440,
    protein: 9.0,
    carb: 62.0,
    fat: 17.0,
    fiber: 2.0,
    defaultUnitGrams: 80, // 1 gói mì 80g ~ 350 kcal
  },
  {
    keywords: ['bánh mì thịt', 'bánh mì trứng', 'bánh mì chả', 'bánh mì thập cẩm', 'banh mi'],
    nameEn: 'Vietnamese stuffed baguette',
    calories: 265,
    protein: 10.5,
    carb: 34.0,
    fat: 9.5,
    fiber: 1.8,
    defaultUnitGrams: 180, // 1 ổ đầy đủ ~ 475 kcal
  },
  {
    keywords: ['bánh mì đen', 'bánh mì nguyên cám', 'whole wheat bread'],
    nameEn: 'whole wheat bread',
    calories: 247,
    protein: 12.5,
    carb: 41.0,
    fat: 3.4,
    fiber: 6.8,
    defaultUnitGrams: 70, // 2 lát
  },
  {
    keywords: ['bánh mì', 'bread', 'sandwich'],
    nameEn: 'bread',
    calories: 265,
    protein: 9.0,
    carb: 49.0,
    fat: 3.2,
    fiber: 2.7,
    defaultUnitGrams: 90,
  },
  {
    keywords: ['khoai lang', 'sweet potato'],
    nameEn: 'sweet potato',
    calories: 86,
    protein: 1.6,
    carb: 20.1,
    fat: 0.1,
    fiber: 3.0,
    defaultUnitGrams: 150,
    rawToCookedRatio: 0.95,
  },
  {
    keywords: ['khoai tây', 'potato'],
    nameEn: 'potato',
    calories: 87,
    protein: 1.9,
    carb: 20.0,
    fat: 0.1,
    fiber: 1.8,
    defaultUnitGrams: 150,
  },
  {
    keywords: ['yến mạch', 'oatmeal', 'oats'],
    nameEn: 'oats',
    calories: 375,
    protein: 13.0,
    carb: 67.0,
    fat: 6.5,
    fiber: 10.0,
    defaultUnitGrams: 50, // 1 khẩu phần yến mạch khô 50g
  },
  {
    keywords: ['ngô', 'bắp luộc', 'bắp ngô', 'corn'],
    nameEn: 'sweet corn',
    calories: 96,
    protein: 3.4,
    carb: 21.0,
    fat: 1.5,
    fiber: 2.4,
    defaultUnitGrams: 160,
  },
  {
    keywords: ['bánh cuốn', 'bánh ướt'],
    nameEn: 'steamed rice rolls',
    calories: 145,
    protein: 5.2,
    carb: 23.0,
    fat: 3.5,
    fiber: 0.6,
    defaultUnitGrams: 250,
  },
  {
    keywords: ['bánh bao'],
    nameEn: 'steamed bun',
    calories: 245,
    protein: 8.5,
    carb: 36.0,
    fat: 7.2,
    fiber: 1.2,
    defaultUnitGrams: 150,
  },

  // === NHÓM ĐẠM: THỊT / CÁ / TRỨNG / HẢI SẢN ===
  {
    keywords: ['ức gà', 'thịt ức gà', 'chicken breast'],
    nameEn: 'chicken breast',
    calories: 165,
    protein: 31.0,
    carb: 0.0,
    fat: 3.6,
    fiber: 0.0,
    defaultUnitGrams: 150,
    rawToCookedRatio: 0.73, // 100g ức gà sống ~ 120 kcal, 22.5g protein
  },
  {
    keywords: ['đùi gà', 'cánh gà', 'thịt gà', 'gà', 'chicken'],
    nameEn: 'chicken',
    calories: 215,
    protein: 24.0,
    carb: 0.0,
    fat: 12.5,
    fiber: 0.0,
    defaultUnitGrams: 150,
    rawToCookedRatio: 0.75,
  },
  {
    keywords: ['thịt bò', 'thăn bò', 'bắp bò', 'bò bít tết', 'bò', 'beef', 'steak'],
    nameEn: 'lean beef',
    calories: 210,
    protein: 26.5,
    carb: 0.0,
    fat: 10.5,
    fiber: 0.0,
    defaultUnitGrams: 150,
    rawToCookedRatio: 0.72, // 100g bò sống ~ 150 kcal, 20g protein
  },
  {
    keywords: ['ba chỉ', 'thịt ba rọi', 'pork belly'],
    nameEn: 'pork belly',
    calories: 385,
    protein: 14.5,
    carb: 0.0,
    fat: 35.0,
    fiber: 0.0,
    defaultUnitGrams: 120,
    rawToCookedRatio: 0.8,
  },
  {
    keywords: ['thịt heo', 'thịt lợn', 'nạc vai', 'thịt nạc', 'sườn heo', 'sườn', 'heo', 'lợn', 'pork'],
    nameEn: 'pork',
    calories: 218,
    protein: 25.0,
    carb: 0.0,
    fat: 12.0,
    fiber: 0.0,
    defaultUnitGrams: 140,
    rawToCookedRatio: 0.74,
  },
  {
    keywords: ['thịt vịt', 'vịt', 'duck'],
    nameEn: 'duck meat',
    calories: 240,
    protein: 21.0,
    carb: 0.0,
    fat: 17.0,
    fiber: 0.0,
    defaultUnitGrams: 150,
    rawToCookedRatio: 0.75,
  },
  {
    keywords: ['lòng trắng trứng', 'egg white'],
    nameEn: 'egg whites',
    calories: 52,
    protein: 11.0,
    carb: 0.7,
    fat: 0.2,
    fiber: 0.0,
    defaultUnitGrams: 35, // 1 lòng trắng
  },
  {
    keywords: ['trứng vịt lộn', 'hột vịt lộn', 'balut'],
    nameEn: 'balut egg',
    calories: 182,
    protein: 13.6,
    carb: 4.0,
    fat: 12.4,
    fiber: 0.0,
    defaultUnitGrams: 65, // 1 quả
  },
  {
    keywords: ['trứng gà', 'trứng vịt', 'trứng ốp la', 'trứng luộc', 'trứng chiên', 'trứng rán', 'trứng', 'egg', 'eggs'],
    nameEn: 'eggs',
    calories: 155,
    protein: 12.6,
    carb: 1.1,
    fat: 10.6,
    fiber: 0.0,
    defaultUnitGrams: 55, // 1 quả trứng ~ 55g (~85 kcal, 7g protein)
    rawToCookedRatio: 0.98,
  },
  {
    keywords: ['cá hồi', 'salmon'],
    nameEn: 'salmon',
    calories: 208,
    protein: 22.0,
    carb: 0.0,
    fat: 13.0,
    fiber: 0.0,
    defaultUnitGrams: 150,
    rawToCookedRatio: 0.82,
  },
  {
    keywords: ['cá ngừ', 'tuna'],
    nameEn: 'tuna',
    calories: 132,
    protein: 28.0,
    carb: 0.0,
    fat: 1.3,
    fiber: 0.0,
    defaultUnitGrams: 140,
    rawToCookedRatio: 0.78,
  },
  {
    keywords: ['cá rô phi', 'cá basa', 'cá thu', 'cá chép', 'cá diêu hồng', 'cá lóc', 'cá', 'fish'],
    nameEn: 'fish',
    calories: 145,
    protein: 24.0,
    carb: 0.0,
    fat: 5.0,
    fiber: 0.0,
    defaultUnitGrams: 150,
    rawToCookedRatio: 0.78,
  },
  {
    keywords: ['tôm', 'mực', 'bạch tuộc', 'hải sản', 'shrimp', 'squid', 'seafood'],
    nameEn: 'shrimp / seafood',
    calories: 115,
    protein: 23.0,
    carb: 1.0,
    fat: 1.7,
    fiber: 0.0,
    defaultUnitGrams: 130,
    rawToCookedRatio: 0.78,
  },
  {
    keywords: ['đậu phụ', 'đậu hũ', 'tofu'],
    nameEn: 'tofu',
    calories: 95,
    protein: 9.5,
    carb: 2.0,
    fat: 5.5,
    fiber: 1.0,
    defaultUnitGrams: 120, // 1 bìa đậu
  },
  {
    keywords: ['chả lụa', 'giò lụa', 'xúc xích', 'lạp xưởng', 'sausage'],
    nameEn: 'Vietnamese pork roll / sausage',
    calories: 235,
    protein: 16.0,
    carb: 3.5,
    fat: 17.5,
    fiber: 0.0,
    defaultUnitGrams: 80,
  },
  {
    keywords: ['whey', 'whey protein', 'bột đạm', 'protein shake'],
    nameEn: 'whey protein',
    calories: 380,
    protein: 78.0,
    carb: 7.0,
    fat: 4.5,
    fiber: 0.0,
    defaultUnitGrams: 32, // 1 muỗng/scoop = 32g (~120 kcal, 25g protein)
  },

  // === NHÓM RAU CỦ & CHẤT XƠ ===
  {
    keywords: ['bông cải xanh', 'súp lơ', 'broccoli', 'cauliflower'],
    nameEn: 'broccoli',
    calories: 35,
    protein: 2.8,
    carb: 7.0,
    fat: 0.4,
    fiber: 3.3,
    defaultUnitGrams: 150,
  },
  {
    keywords: ['rau muống', 'cải thìa', 'cải ngọt', 'rau cải', 'bắp cải', 'rau luộc', 'rau xanh', 'cải bó xôi', 'spinach', 'cabbage', 'vegetables', 'rau'],
    nameEn: 'green vegetables',
    calories: 26,
    protein: 2.1,
    carb: 4.5,
    fat: 0.3,
    fiber: 2.8,
    defaultUnitGrams: 150,
  },
  {
    keywords: ['xà lách', 'salad', 'dưa leo', 'dưa chuột', 'cà chua', 'cucumber', 'tomato'],
    nameEn: 'fresh salad / vegetables',
    calories: 20,
    protein: 1.1,
    carb: 3.8,
    fat: 0.2,
    fiber: 1.8,
    defaultUnitGrams: 150,
  },
  {
    keywords: ['cà rốt', 'bí đỏ', 'bí đao', 'đậu cô ve', 'măng tây', 'nấm', 'mushroom', 'carrot', 'pumpkin'],
    nameEn: 'root vegetables / mushrooms',
    calories: 38,
    protein: 2.0,
    carb: 8.0,
    fat: 0.3,
    fiber: 2.6,
    defaultUnitGrams: 140,
  },

  // === NHÓM TRÁI CÂY ===
  {
    keywords: ['chuối', 'banana'],
    nameEn: 'banana',
    calories: 89,
    protein: 1.1,
    carb: 22.8,
    fat: 0.3,
    fiber: 2.6,
    defaultUnitGrams: 115, // 1 quả chuối vừa
  },
  {
    keywords: ['táo', 'lê', 'ổi', 'apple', 'pear', 'guava'],
    nameEn: 'apple / guava',
    calories: 55,
    protein: 0.8,
    carb: 14.0,
    fat: 0.2,
    fiber: 3.2,
    defaultUnitGrams: 150,
  },
  {
    keywords: ['bơ', 'quả bơ', 'avocado'],
    nameEn: 'avocado',
    calories: 160,
    protein: 2.0,
    carb: 8.5,
    fat: 14.7,
    fiber: 6.7,
    defaultUnitGrams: 130,
  },
  {
    keywords: ['cam', 'bưởi', 'dưa hấu', 'thanh long', 'xoài', 'nho', 'dâu tây', 'đu đủ', 'orange', 'watermelon', 'mango', 'fruit'],
    nameEn: 'fresh fruit',
    calories: 48,
    protein: 0.8,
    carb: 11.5,
    fat: 0.2,
    fiber: 1.8,
    defaultUnitGrams: 160,
  },

  // === SỮA, HẠT & ĐỒ UỐNG ===
  {
    keywords: ['sữa tươi không đường', 'sữa không đường', 'unsweetened milk'],
    nameEn: 'unsweetened milk',
    calories: 60,
    protein: 3.2,
    carb: 4.7,
    fat: 3.2,
    fiber: 0.0,
    defaultUnitGrams: 220, // 1 bịch/hộp 220ml
    isLiquid: true,
  },
  {
    keywords: ['sữa tươi', 'sữa có đường', 'sữa đậu nành', 'sữa hạt', 'sữa', 'milk'],
    nameEn: 'milk',
    calories: 74,
    protein: 3.1,
    carb: 8.5,
    fat: 3.0,
    fiber: 0.2,
    defaultUnitGrams: 200,
    isLiquid: true,
  },
  {
    keywords: ['sữa chua hy lạp', 'greek yogurt'],
    nameEn: 'Greek yogurt',
    calories: 97,
    protein: 9.0,
    carb: 3.8,
    fat: 5.0,
    fiber: 0.0,
    defaultUnitGrams: 100,
  },
  {
    keywords: ['sữa chua', 'yogurt'],
    nameEn: 'yogurt',
    calories: 85,
    protein: 3.5,
    carb: 12.0,
    fat: 2.5,
    fiber: 0.0,
    defaultUnitGrams: 100, // 1 hộp sữa chua
  },
  {
    keywords: ['hạnh nhân', 'hạt điều', 'óc chó', 'đậu phộng', 'lạc', 'bơ đậu phộng', 'hạt chia', 'nuts', 'almond', 'peanut'],
    nameEn: 'nuts / peanut butter',
    calories: 575,
    protein: 21.0,
    carb: 20.0,
    fat: 49.0,
    fiber: 8.5,
    defaultUnitGrams: 30, // 1 nắm nhỏ 30g
  },
  {
    keywords: ['trà sữa', 'milk tea', 'boba'],
    nameEn: 'milk tea',
    calories: 95,
    protein: 1.2,
    carb: 16.5,
    fat: 2.8,
    fiber: 0.2,
    defaultUnitGrams: 450,
    isLiquid: true,
  },
  {
    keywords: ['cà phê sữa', 'bạc xỉu', 'latte', 'cappuccino'],
    nameEn: 'milk coffee',
    calories: 72,
    protein: 1.8,
    carb: 11.0,
    fat: 2.2,
    fiber: 0.0,
    defaultUnitGrams: 200,
    isLiquid: true,
  },
  {
    keywords: ['cà phê đen', 'americano', 'espresso', 'trà xanh', 'trà đá', 'black coffee', 'tea'],
    nameEn: 'black coffee / tea',
    calories: 5,
    protein: 0.2,
    carb: 1.0,
    fat: 0.0,
    fiber: 0.0,
    defaultUnitGrams: 200,
    isLiquid: true,
  },
];

/**
 * Tool 1: Phân tích chuỗi định lượng người dùng nhập ("200g", "2 quả", "1.5 bát", "3 lạng"...) ra số gam thực tế
 */
export function parsePortionGrams(weightStr: string | undefined, defaultUnitGrams: number): number {
  if (!weightStr || !weightStr.trim()) return defaultUnitGrams;
  const s = weightStr.toLowerCase().trim().replace(',', '.');

  if (s.includes('nửa cân') || s.includes('nua can')) return 500;
  if (s.includes('nửa bát') || s.includes('nửa chén') || s.includes('nửa phần')) {
    return Math.round(defaultUnitGrams * 0.5);
  }

  const numMatch = s.match(/(\d+(\.\d+)?)/);
  const num = numMatch ? parseFloat(numMatch[1]) : 1;

  if (/\b(kg|kí|ký)\b/.test(s)) {
    return Math.round(num * 1000);
  }
  if (/\b(lạng|lang)\b/.test(s)) {
    return Math.round(num * 100);
  }
  if (/\b(g|gr|gam|gram|ml)\b/.test(s)) {
    return Math.max(5, Math.round(num));
  }
  if (/\b(lít|lit|l)\b/.test(s)) {
    return Math.round(num * 1000);
  }
  if (/\b(muỗng|thìa|scoop)\b/.test(s)) {
    return Math.round(num * (defaultUnitGrams <= 40 ? defaultUnitGrams : 20));
  }
  if (/\b(lát|miếng nhỏ)\b/.test(s)) {
    return Math.round(num * 35);
  }
  if (/\b(tô lớn|suất lớn|đĩa lớn)\b/.test(s)) {
    return Math.round(num * defaultUnitGrams * 1.25);
  }
  // Các đơn vị đếm: quả, trái, cái, bát, chén, tô, đĩa, phần, hộp, bịch, ly, cốc, ổ, gói, bìa...
  if (num > 0 && num <= 20) {
    return Math.round(num * defaultUnitGrams);
  }
  // Nếu chỉ gõ con số >= 25 (VD: "250") thì hiểu là gam
  if (num > 20) {
    return Math.round(num);
  }
  return defaultUnitGrams;
}

/**
 * Tool 2: Tra cứu món ăn trong Knowledge Base (hỗ trợ cả món kết hợp như "Cơm ức gà", "Trứng rán thịt")
 */
export function lookupFoodEntry(foodName: string): MacroPer100g {
  const lower = foodName.toLowerCase().trim();

  // Tìm khớp chính xác nhất
  for (const item of FOOD_DATABASE) {
    for (const kw of item.keywords) {
      if (lower.includes(kw)) {
        return item;
      }
    }
  }

  // Fallback thông minh cho món ăn hỗn hợp chưa có trong danh mục
  return {
    keywords: [lower],
    nameEn: foodName,
    calories: 145,
    protein: 8.5,
    carb: 16.0,
    fat: 5.0,
    fiber: 1.5,
    defaultUnitGrams: 180,
    rawToCookedRatio: 0.85,
  };
}

/**
 * Tool 3: Tính toán chính xác 5 chỉ số macro cho 1 món ăn dựa trên khối lượng, trạng thái sống/chín và cách chế biến
 */
export function calculateSingleItemMacros(meal: FoodItem): FoodItem {
  const dbEntry = lookupFoodEntry(meal.name);
  const grams = parsePortionGrams(meal.weight, dbEntry.defaultUnitGrams);
  const factor = grams / 100;

  // Hệ số chuyển đổi Sống (Raw) vs Chín (Cooked)
  // Cơ sở dữ liệu tính theo 100g đã nấu chín. Nếu cân lúc còn sống, thịt/cá chứa nhiều nước hơn (~0.74x), gạo khô đặc hơn (~2.8x)
  let stateMultiplier = 1.0;
  if (meal.foodState === 'raw' && dbEntry.rawToCookedRatio) {
    stateMultiplier = dbEntry.rawToCookedRatio;
  }

  let baseCal = dbEntry.calories * factor * stateMultiplier;
  let basePro = dbEntry.protein * factor * stateMultiplier;
  let baseCarb = dbEntry.carb * factor * stateMultiplier;
  let baseFat = dbEntry.fat * factor * stateMultiplier;
  let baseFiber = dbEntry.fiber * factor * stateMultiplier;

  // Cộng thêm dầu mỡ theo phương pháp chế biến (nếu chọn đã nấu chín)
  if (meal.foodState !== 'raw' && !dbEntry.isLiquid) {
    const method: CookingMethod | undefined = meal.cookingMethod;
    if (method === 'chien') {
      // Chiên/rán thấm dầu: ~9g chất béo (+81 kcal) trên mỗi 100g thực phẩm
      const extraFat = 9.0 * factor;
      baseFat += extraFat;
      baseCal += extraFat * 9;
    } else if (method === 'xao') {
      // Xào: ~4.5g chất béo (+40.5 kcal) trên mỗi 100g thực phẩm
      const extraFat = 4.5 * factor;
      baseFat += extraFat;
      baseCal += extraFat * 9;
    } else if (method === 'nuong') {
      // Nướng: phết nhẹ dầu/gia vị (~1.2g fat / 100g)
      const extraFat = 1.2 * factor;
      baseFat += extraFat;
      baseCal += extraFat * 9;
    }
  }

  return {
    ...meal,
    calories: Math.max(0, Math.round(baseCal)),
    protein: Math.max(0, Math.round(basePro * 10) / 10),
    carb: Math.max(0, Math.round(baseCarb * 10) / 10),
    fat: Math.max(0, Math.round(baseFat * 10) / 10),
    fiber: Math.max(0, Math.round(baseFiber * 10) / 10),
  };
}

export interface UserNutritionTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  targetCarb: number;
  targetFat: number;
  targetFiber: number;
}

/**
 * Tool 4: Tính toán BMR, TDEE và nhu cầu Macro cá nhân hóa theo hồ sơ thể trạng của người dùng
 */
export function calculateUserNutritionTargets(profile: UserProfile): UserNutritionTargets {
  const weight = parseFloat(String(profile.weightKg || '65')) || 65;
  const height = parseFloat(String(profile.heightCm || '170')) || 170;
  const age = parseInt(String(profile.age || '22'), 10) || 22;

  // Công thức Mifflin-St Jeor chuẩn
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  const tdee = Math.round(bmr * 1.45); // Mức vận động rèn luyện kỷ luật hàng ngày

  let targetCalories = tdee;
  let proteinPerKg = 1.8;

  const goal = (profile.focusGoal || '').toUpperCase();
  if (goal.includes('HEALTH') || goal.includes('FITNESS')) {
    proteinPerKg = 2.0;
  }

  const targetProtein = Math.round(weight * proteinPerKg);
  const targetFat = Math.round((targetCalories * 0.25) / 9);
  const targetCarb = Math.round(
    Math.max(100, (targetCalories - targetProtein * 4 - targetFat * 9) / 4)
  );
  const targetFiber = 25;

  return {
    bmr,
    tdee,
    targetCalories,
    targetProtein,
    targetCarb,
    targetFat,
    targetFiber,
  };
}

