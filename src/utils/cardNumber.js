// Card checks on the deposit page. No payment provider is connected, so
// these only catch typing mistakes before the deposit is recorded.

// Luhn check: from the right, double every second digit (subtracting 9 from
// anything over 9) and add everything up. A real card number gives a total
// that ends in 0, so a single mistyped digit, or most swaps of two
// neighbouring digits, makes it fail.
export function luhn(digits) {
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// Visa starts with 4; Mastercard with 51–55 or 2221–2720.
export function detectCardType(digits) {
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits) || /^2(?:2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(digits)) return "mastercard";
  return null;
}
