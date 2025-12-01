export type DateRangeFilter = "month" | "week" | "year";

export function getDateRangeForPeriod(
  period: DateRangeFilter,
  referenceDate: Date
): { start: Date; end: Date } {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  switch (period) {
    case "week": {
      // Get Monday of the week
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      // Get Sunday of the week
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "month": {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0); // Last day of the month
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "year": {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    }
  }

  return { start, end };
}

export function formatDateRange(
  start: Date,
  end: Date,
  period: DateRangeFilter
): string {
  if (period === "month") {
    return start.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } else if (period === "week") {
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  } else {
    // year
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }
}

