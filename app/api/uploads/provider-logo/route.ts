import { handleFileDelete, handleFileUpload } from '@/lib/api/upload';

export async function POST(req: Request) {
  return handleFileUpload(req, 'provider-logos');
}

/** Lets the provider form clean up a logo it uploaded when the save then fails. */
export async function DELETE(req: Request) {
  return handleFileDelete(req, 'provider-logos');
}
