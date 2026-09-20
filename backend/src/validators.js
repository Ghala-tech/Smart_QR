const { ApiError } = require('./errors');

function requireString(value, fieldName, { maxLen = 2000, minLen = 1 } = {}) {
  if (typeof value !== 'string' || value.trim().length < minLen) {
    throw new ApiError(400, `الحقل "${fieldName}" مطلوب.`);
  }
  if (value.length > maxLen) {
    throw new ApiError(400, `الحقل "${fieldName}" أطول من الحد المسموح (${maxLen} حرف).`);
  }
  return value.trim();
}

function optionalString(value, fieldName, { maxLen = 2000 } = {}) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') {
    throw new ApiError(400, `الحقل "${fieldName}" يجب أن يكون نصًا.`);
  }
  if (value.length > maxLen) {
    throw new ApiError(400, `الحقل "${fieldName}" أطول من الحد المسموح (${maxLen} حرف).`);
  }
  return value.trim();
}

function requireEnum(value, allowed, fieldName) {
  if (!allowed.includes(value)) {
    throw new ApiError(400, `قيمة غير صحيحة للحقل "${fieldName}". القيم المسموحة: ${allowed.join(', ')}`);
  }
  return value;
}

function requireInt(value, fieldName, { min, max } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    throw new ApiError(400, `الحقل "${fieldName}" يجب أن يكون رقمًا صحيحًا.`);
  }
  if (min !== undefined && n < min) throw new ApiError(400, `الحقل "${fieldName}" أصغر من الحد المسموح (${min}).`);
  if (max !== undefined && n > max) throw new ApiError(400, `الحقل "${fieldName}" أكبر من الحد المسموح (${max}).`);
  return n;
}

function optionalImageDataUrl(value, fieldName, { maxBytes = 4 * 1024 * 1024 } = {}) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !value.startsWith('data:image/')) {
    throw new ApiError(400, `الحقل "${fieldName}" يجب أن يكون صورة صالحة.`);
  }
  // Rough size check on the base64 payload (each 4 base64 chars ~= 3 bytes).
  const commaIdx = value.indexOf(',');
  const b64 = commaIdx >= 0 ? value.slice(commaIdx + 1) : value;
  const approxBytes = Math.floor((b64.length * 3) / 4);
  if (approxBytes > maxBytes) {
    throw new ApiError(400, `حجم الصورة كبير جدًا (الحد الأقصى ${Math.floor(maxBytes / (1024 * 1024))}MB).`);
  }
  return value;
}

function notFound(message) {
  throw new ApiError(404, message);
}

module.exports = {
  requireString,
  optionalString,
  requireEnum,
  requireInt,
  optionalImageDataUrl,
  notFound,
};
