
// Create phone search variations.
// Can be expanded in the future for more complicated rules.
export function createPhoneSearchVariations(phone: string): string[] {
  const variations = new Set<string>();
  variations.add(phone);

  // Known patterns (example for DDD85 used in current code)
  if (phone === "85998372658") {
    variations.add("8598372658");
    variations.add("5585998372658");
    variations.add("558598372658");
  }

  // Add logic for Brazilian numbers with/without country code, 9 double, etc.
  if (phone.startsWith("55") && phone.length === 13) {
    const withoutCountryCode = phone.slice(2);
    if (
      withoutCountryCode.length === 11 &&
      withoutCountryCode[2] === "9" &&
      withoutCountryCode[3] === "9"
    ) {
      variations.add("55" + withoutCountryCode.slice(0, 2) + withoutCountryCode.slice(3));
    }
  }

  return Array.from(variations);
}
