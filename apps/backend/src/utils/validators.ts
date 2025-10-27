export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function validateName(name: string): boolean {
  return name.length >= 2 && name.length <= 100;
}

export function validateAmount(amount: string): boolean {
  try {
    const bn = BigInt(amount);
    return bn > 0n;
  } catch {
    return false;
  }
}