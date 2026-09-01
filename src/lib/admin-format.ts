// Shared formatting helpers for the admin panel (Arabic / RTL).

const currencyNumberFormatter = new Intl.NumberFormat("ar-SA", {
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("ar-SA");

const dateFormatter = new Intl.DateTimeFormat("ar-SA", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ar-SA", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatCurrency(value: number): string {
  return `$${currencyNumberFormatter.format(value)}`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}
