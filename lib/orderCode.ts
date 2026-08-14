/**
 * A short, human-quotable code for a marketplace order.
 *
 * The API's `Order` carries only a UUID — there is no order number a client could read
 * out on the phone — so the head of the id stands in for one. Deriving it in one place
 * matters: the list and the detail page must show the same code for the same order.
 */
export function orderCode(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}
