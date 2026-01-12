export function formatMoney(
  amount: number | undefined | null,
  currency: string = "VND"
): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return "-";
  }

  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(amount);
}

export function formatDateTime(dateTime: string | undefined | null): string {
  if (!dateTime) {
    return "-";
  }

  try {
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "-";
  }
}
