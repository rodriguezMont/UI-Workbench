import { describe, expect, it } from "vitest";

import { messages } from "@/messages";

import { CARD_MASK, EXPIRY_MASK, cardBrand, checkCardName, checkCardNumber, checkCvv, checkExpiry, cvvLength, luhn } from "./card";
import { applyMask } from "./mask";

const m = messages.ui.card;

// The card networks' public test numbers: they pass Luhn and exist only in
// the networks' test environments.
const VISA = "4111111111111111";
const MASTERCARD = "5555555555554444";
const AMEX = "378282246310005";
const DINERS = "30569309025904";

describe("the card brand", () => {
  it("tells American Express apart from the rest, which is what changes the format", () => {
    expect(cardBrand(AMEX)).toBe("amex");
    expect(cardBrand("341111111111111")).toBe("amex");
    expect(cardBrand(VISA)).toBe("other");
    expect(cvvLength(AMEX)).toBe(4);
    expect(cvvLength(VISA)).toBe(3);
  });
});

describe("the check digit", () => {
  it("accepts the networks' test numbers", () => {
    expect(luhn(VISA)).toBe(true);
    expect(luhn(MASTERCARD)).toBe(true);
    expect(luhn(AMEX)).toBe(true);
  });

  it("catches a wrong digit and a swapped pair", () => {
    expect(luhn("4111111111111112")).toBe(false);
    expect(luhn("5555555555544454")).toBe(false);
  });

  it("refuses what does not even have a card's length", () => {
    expect(luhn("411111")).toBe(false);
    expect(luhn("")).toBe(false);
  });
});

describe("the masks", () => {
  it("groups by four, and American Express as 4-6-5", () => {
    expect(applyMask(CARD_MASK, VISA)).toBe("4111 1111 1111 1111");
    expect(applyMask(CARD_MASK, AMEX)).toBe("3782 822463 10005");
    expect(applyMask(CARD_MASK, "41111")).toBe("4111 1");
  });

  it("the date gets its slash on the third digit, as MM/YY", () => {
    expect(applyMask(EXPIRY_MASK, "09")).toBe("09");
    expect(applyMask(EXPIRY_MASK, "0928")).toBe("09/28");
    expect(applyMask(EXPIRY_MASK, "09/28/99")).toBe("09/28");
  });
});

describe("the masks stop where the card does", () => {
  it("16 digits for most cards, 15 for American Express", () => {
    expect(applyMask(CARD_MASK, "41111111111111111234")).toBe("4111 1111 1111 1111");
    expect(applyMask(CARD_MASK, "378282246310005999")).toBe("3782 822463 10005");
  });

  it("the expiry takes a month from 01 to 12 only", () => {
    expect(applyMask(EXPIRY_MASK, "13")).toBe("1");
    expect(applyMask(EXPIRY_MASK, "00")).toBe("0");
    expect(applyMask(EXPIRY_MASK, "1228")).toBe("12/28");
  });
});

describe("checking the number", () => {
  it("empty is not an error; a test number passes", () => {
    expect(checkCardNumber("")).toBeNull();
    expect(checkCardNumber("4111 1111 1111 1111")).toBeNull();
    expect(checkCardNumber("3782 822463 10005")).toBeNull();
  });

  it("accepts lengths other than 16", () => {
    // 14 digits, and 19 digits: both pass Luhn, and neither has 16.
    expect(checkCardNumber(DINERS)).toBeNull();
    expect(checkCardNumber("6011 0000 0000 0000 001")).toBeNull();
  });

  it("incomplete and mistyped get different sentences", () => {
    expect(checkCardNumber("4111 1111")).toBe(m.numberIncomplete);
    expect(checkCardNumber("4111 1111 1111 1112")).toBe(m.numberInvalid);
  });
});

describe("the expiration date", () => {
  const today = new Date(2026, 8, 17); // September 17, 2026

  it("a card is good through the end of the printed month", () => {
    expect(checkExpiry("09/26", today)).toBeNull();
    expect(checkExpiry("12/30", today)).toBeNull();
  });

  it("an expired card says when it expired", () => {
    expect(checkExpiry("08/26", today)).toBe(m.expired("08/26"));
    expect(checkExpiry("12/25", today)).toBe("This card expired in 12/25.");
  });

  it("a month that does not exist, and an incomplete date", () => {
    expect(checkExpiry("13/28", today)).toBe(m.monthInvalid);
    expect(checkExpiry("00/28", today)).toBe(m.monthInvalid);
    expect(checkExpiry("09/2", today)).toBe(m.expiryIncomplete);
    expect(checkExpiry("", today)).toBeNull();
  });
});

describe("the security code and the name", () => {
  it("three digits, four for American Express", () => {
    expect(checkCvv("123", VISA)).toBeNull();
    expect(checkCvv("12", VISA)).toBe(m.cvvLength(3));
    expect(checkCvv("1234", AMEX)).toBeNull();
    expect(checkCvv("123", AMEX)).toBe(m.cvvLength(4));
    expect(checkCvv("", VISA)).toBeNull();
  });

  it("the printed name must be the full one", () => {
    expect(checkCardName("JANE Q DOE")).toBeNull();
    expect(checkCardName("JANE")).toBe(m.nameIncomplete);
    expect(checkCardName("  ")).toBeNull();
  });
});
