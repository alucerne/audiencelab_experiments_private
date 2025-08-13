import { NextRequest, NextResponse } from 'next/server';
import { enhanceRouteHandler } from '@kit/next/routes';
import { getBatchUploadData, batchUploadStore } from '../route';

export const GET = enhanceRouteHandler(
  async function({ params, user }) {
    const { id: uploadId } = params;
    
    if (!uploadId) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Upload ID is required' 
        },
        { status: 400 }
      );
    }
    
    // Get batch upload data
    const uploadData = getBatchUploadData(uploadId);
    
    if (!uploadData) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Batch upload not found' 
        },
        { status: 404 }
      );
    }

    // Check if user owns this upload
    if (uploadData.user_id !== user.id) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Access denied' 
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: 'success',
      upload_id: uploadData.upload_id,
      upload_name: uploadData.upload_name,
      records: uploadData.records,
      fields: uploadData.fields,
      created_at: uploadData.created_at,
      rows_received: uploadData.rows_received,
      upload_status: uploadData.status
    });
  },
  { 
    auth: true 
  }
);

export const DELETE = enhanceRouteHandler(
  async function({ params, user }) {
    const { id: uploadId } = params;
    
    if (!uploadId) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Upload ID is required' 
        },
        { status: 400 }
      );
    }
    
    // Get batch upload data
    const uploadData = getBatchUploadData(uploadId);
    
    if (!uploadData) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Batch upload not found' 
        },
        { status: 404 }
      );
    }

    // Check if user owns this upload
    if (uploadData.user_id !== user.id) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Access denied' 
        },
        { status: 403 }
      );
    }

    // Delete the upload (in production, this would delete from database/storage)
    delete batchUploadStore[uploadId];

    return NextResponse.json({
      status: 'success',
      message: 'Batch upload deleted successfully'
    });
  },
  { 
    auth: true 
  }
); 