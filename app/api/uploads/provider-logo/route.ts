import { handleFileUpload } from '@/lib/api/upload';

export async function POST(req: Request) {
  return handleFileUpload(req, 'provider-logos');
}
