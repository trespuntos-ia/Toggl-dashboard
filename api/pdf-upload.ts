import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Habilitar CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { reportId, accountId, fileName, fileData } = request.body;

    if (!reportId || !accountId || !fileName || !fileData) {
      response.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      response.status(500).json({ error: 'Supabase not configured' });
      return;
    }

    const client = createClient(supabaseUrl, supabaseKey);

    // Convertir base64 a buffer
    const fileBuffer = Buffer.from(fileData, 'base64');
    const filePath = `pdfs/${reportId}/${Date.now()}-${fileName}`;

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await client.storage
      .from('toggl-pdfs')
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Obtener URL pública
    const { data: urlData } = client.storage
      .from('toggl-pdfs')
      .getPublicUrl(filePath);

    // Crear registro en la base de datos
    const pdfRecord = {
      report_id: reportId,
      account_id: accountId,
      file_name: fileName,
      file_url: urlData.publicUrl,
      file_size: fileBuffer.length,
      date_range_start: new Date().toISOString().split('T')[0], // Por ahora, se actualizará después del procesamiento
      date_range_end: new Date().toISOString().split('T')[0],
      entries: [],
      processing_status: 'pending',
    };

    const { data: dbData, error: dbError } = await client
      .from('historical_pdf_data')
      .insert(pdfRecord)
      .select('id')
      .single();

    if (dbError) {
      throw dbError;
    }

    // Disparar procesamiento asíncrono
    // En producción, esto podría ser una cola de trabajos
    setTimeout(() => {
      processPDF(dbData.id, fileBuffer, pdfRecord).catch(console.error);
    }, 100);

    response.status(200).json({
      id: dbData.id,
      message: 'PDF uploaded successfully, processing started',
    });
  } catch (error: any) {
    console.error('Error uploading PDF:', error);
    response.status(500).json({
      error: 'Error uploading PDF',
      message: error.message,
    });
  }
}

async function processPDF(
  pdfId: string,
  fileBuffer: Buffer,
  pdfRecord: any
) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) return;

  const client = createClient(supabaseUrl, supabaseKey);

  try {
    // Actualizar estado a processing
    await client
      .from('historical_pdf_data')
      .update({ processing_status: 'processing' })
      .eq('id', pdfId);

    // Procesar PDF (esto requiere la librería pdf-parse)
    // Por ahora, retornamos un error ya que necesitamos instalar pdf-parse en el servidor
    // En producción, esto debería ejecutarse en una Edge Function de Supabase o un worker
    
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(fileBuffer);
    
    // Extraer datos del PDF (esto es un ejemplo básico, necesitarás ajustarlo según el formato)
    const entries = extractEntriesFromPDF(pdfData.text);
    
    // Actualizar con datos procesados
    await client
      .from('historical_pdf_data')
      .update({
        entries: entries,
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', pdfId);

  } catch (error: any) {
    console.error('Error processing PDF:', error);
    await client
      .from('historical_pdf_data')
      .update({
        processing_status: 'error',
        error_message: error.message,
      })
      .eq('id', pdfId);
  }
}

function extractEntriesFromPDF(text: string): any[] {
  // Esta función necesita ser implementada según el formato específico del PDF de Toggl
  // Por ahora retornamos un array vacío
  // TODO: Implementar parser según el formato del PDF
  return [];
}

