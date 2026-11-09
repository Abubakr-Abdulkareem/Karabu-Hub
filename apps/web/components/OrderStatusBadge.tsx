export const statusLabels: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  processing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const styles: Record<string, string> = {
  pending: "bg-surface-2 text-muted",
  paid: "bg-blue-500/15 text-blue-300",
  processing: "bg-amber-500/15 text-amber-300",
  out_for_delivery: "bg-purple-500/15 text-purple-300",
  delivered: "bg-green-500/15 text-green-300",
  cancelled: "bg-red-500/15 text-red-300",
};

export default function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ?? styles.pending
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}