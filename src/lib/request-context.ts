import { headers } from 'next/headers';

export async function getRequestId(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get('x-request-id') ?? undefined;
}

export async function getTenantContext(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get('x-tenant-id') ?? undefined;
}

export async function getUserContext(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get('x-user-id') ?? undefined;
}
