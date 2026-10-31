// STAND-IN for Savio's email module.
//
// The real module sends mail. Until it is merged, "sending" writes the message to billing.outbox
// (local, offline) so invoice emails and overdue reminders can still be shown and tested.
// Same call, same inputs: sendMail(conn, { kind, to, subject, body, invoiceId }).

export async function sendMail(conn, { kind, to, subject, body, invoiceId = null }) {
  const { id } = await conn.one('outbox_insert', [kind, to ?? null, subject, body, invoiceId]);
  return { id };
}
