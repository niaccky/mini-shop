import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// GTIN验证结果接口
export interface GTINValidationResult {
  isValid: boolean;
  error?: string;
  type?: 'GTIN-8' | 'GTIN-12' | 'GTIN-13' | 'GTIN-14';
  formatted?: string;
}

// GTIN验证函数（简单版本，向后兼容）
export function validateGTIN(gtin: string): boolean {
  return validateGTINDetailed(gtin).isValid;
}

// 详细的GTIN验证函数
export function validateGTINDetailed(gtin: string): GTINValidationResult {
  if (!gtin || typeof gtin !== 'string') {
    return { isValid: false, error: 'GTIN不能为空' };
  }

  // 移除所有非数字字符
  const cleanGTIN = gtin.replace(/\D/g, '');
  
  if (cleanGTIN.length === 0) {
    return { isValid: false, error: 'GTIN必须包含数字' };
  }

  // GTIN可以是8、12、13或14位数字
  const validLengths = [8, 12, 13, 14];
  if (!validLengths.includes(cleanGTIN.length)) {
    return { 
      isValid: false, 
      error: `GTIN长度必须是8、12、13或14位，当前为${cleanGTIN.length}位` 
    };
  }

  // 确定GTIN类型
  const gtinTypes: Record<number, 'GTIN-8' | 'GTIN-12' | 'GTIN-13' | 'GTIN-14'> = {
    8: 'GTIN-8',
    12: 'GTIN-12', 
    13: 'GTIN-13',
    14: 'GTIN-14'
  };
  const type = gtinTypes[cleanGTIN.length];
  
  // 计算校验位
  const digits = cleanGTIN.split('').map(Number);
  const checkDigit = digits.pop()!;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const multiplier = (digits.length - i) % 2 === 0 ? 1 : 3;
    sum += digits[i] * multiplier;
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  
  if (checkDigit !== calculatedCheckDigit) {
    return { 
      isValid: false, 
      error: `校验位错误，期望${calculatedCheckDigit}，实际${checkDigit}` 
    };
  }

  return { 
    isValid: true, 
    type,
    formatted: formatGTIN(cleanGTIN)
  };
}

// 格式化GTIN显示
export function formatGTIN(gtin: string): string {
  const cleanGTIN = gtin.replace(/\D/g, '');
  
  switch (cleanGTIN.length) {
    case 8:
      return cleanGTIN.replace(/(\d{4})(\d{4})/, '$1 $2');
    case 12:
      return cleanGTIN.replace(/(\d{1})(\d{5})(\d{5})(\d{1})/, '$1 $2 $3 $4');
    case 13:
      return cleanGTIN.replace(/(\d{1})(\d{6})(\d{6})/, '$1 $2 $3');
    case 14:
      return cleanGTIN.replace(/(\d{1})(\d{1})(\d{6})(\d{6})/, '$1 $2 $3 $4');
    default:
      return cleanGTIN;
  }
}

// 格式化价格显示
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(price);
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}