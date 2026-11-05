import { handleFileDelete, handleFileUpload } from '@/lib/api/upload';

export async function POST(req: Request) {
  return handleFileUpload(req, 'service-images');
}

/** Lets the provider form clean up a logo it uploaded when the save then fails. */
export async function DELETE(req: Request) {
  return handleFileDelete(req, 'service-images');
}
