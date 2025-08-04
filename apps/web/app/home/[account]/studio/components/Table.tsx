'use client';

import React, { useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
} from '@tanstack/react-table';
import { parseCSV } from '../utils/parseCSV';
import { CustomColumn } from '../utils/fieldOptions';
import { validateEmail, validateURL, enrichCompany, getJobSeniority } from '../utils/triggerFieldAPI';
import { X, Code } from 'lucide-react';

interface DataRow {
  domain: string;
  enrich_company: string;
  url: string;
  company_name?: string;
  company_domain?: string;
  industry?: string;
  job_title?: string;
  seniority?: string;
  department?: string;
  employee_count?: string;
  company_revenue?: string;
  city?: string;
  state?: string;
  zip?: string;
  age?: number;
  gender?: string;
  income_range?: string;
  education?: string;
  homeowner?: string;
  married?: string;
  [key: string]: any; // Allow dynamic custom fields
}

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface TableProps {
  filters: Filter[];
  previewData?: any[];
  loading?: boolean;
  customColumns?: CustomColumn[];
  hiddenFields?: Set<string>;
  onAddField?: (field: CustomColumn) => void;
  onDeleteField?: (fieldToDelete: string) => void;
}

export default function Table({ filters, previewData, loading, customColumns = [], hiddenFields = new Set(), onDeleteField }: TableProps) {
  const [rowData, setRowData] = useState<DataRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [runningCodeTransforms, setRunningCodeTransforms] = useState(false);
  const [dynamicColumns, setDynamicColumns] = useState<ColumnDef<DataRow>[]>([]);

  const runEnrichment = async () => {
    if (customColumns.length === 0) return;
    
    setEnriching(true);
    try {
      const updatedData = await Promise.all(
        rowData.map(async (row) => {
          const enrichedRow = { ...row };
          
          for (const col of customColumns) {
            switch (col.type) {
              case 'email':
                if (row.email) {
                  enrichedRow[col.field] = await validateEmail(row.email);
                }
                break;
              case 'url':
                if (row.url) {
                  enrichedRow[col.field] = await validateURL(row.url);
                }
                break;
              case 'text':
                if (row.domain) {
                  enrichedRow[col.field] = await enrichCompany(row.domain);
                }
                break;
              case 'select':
                if (row.job_title) {
                  enrichedRow[col.field] = await getJobSeniority(row.job_title);
                }
                break;
              default:
                enrichedRow[col.field] = 'N/A';
            }
          }
          
          return enrichedRow;
        })
      );
      
      setRowData(updatedData);
    } catch (error) {
      console.error('Enrichment error:', error);
    } finally {
      setEnriching(false);
    }
  };

  const runCodeTransforms = async () => {
    const codeColumns = customColumns.filter(col => col.type === 'code' && col.transform);
    if (codeColumns.length === 0) return;
    
    setRunningCodeTransforms(true);
    try {
      const updatedData = await Promise.all(
        rowData.map(async (row, rowIndex) => {
          const updatedRow = { ...row };
          const errors: string[] = [];
          
          for (const col of codeColumns) {
            if (col.transform && col.sourceField) {
              try {
                const sourceValue = row[col.sourceField] || '';
                const transformFn = new Function('input', col.transform);
                const transformedValue = transformFn(sourceValue);
                updatedRow[col.field] = transformedValue;
              } catch (error) {
                updatedRow[col.field] = 'ERR';
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${col.headerName}: ${errorMessage}`);
              }
            }
          }
          
          // Log errors for debugging (only first few rows to avoid spam)
          if (errors.length > 0 && rowIndex < 5) {
            console.warn(`Row ${rowIndex + 1} transform errors:`, errors);
          }
          
          return updatedRow;
        })
      );
      
      setRowData(updatedData);
      
      // Show success message
      const totalErrors = updatedData.reduce((count, row) => {
        return count + Object.values(row).filter(val => val === 'ERR').length;
      }, 0);
      
      if (totalErrors > 0) {
        console.warn(`Transform completed with ${totalErrors} errors`);
      } else {
        console.log('All transforms completed successfully');
      }
    } catch (error) {
      console.error('Code transform error:', error);
    } finally {
      setRunningCodeTransforms(false);
    }
  };

  const baseColumns: ColumnDef<DataRow>[] = [
    {
      accessorKey: 'domain',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Domain</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('domain')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Domain"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'enrich_company',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('enrich_company')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_name',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Company Name</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('company_name')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Company Name"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'job_title',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Job Title</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('job_title')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Job Title"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'seniority',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Seniority</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('seniority')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Seniority"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Department</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('department')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Department"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'industry',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Industry</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('industry')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Industry"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'city',
      header: () => (
        <div className="flex items-center justify-between">
          <span>City</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('city')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete City"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'state',
      header: () => (
        <div className="flex items-center justify-between">
          <span>State</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('state')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete State"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'age',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Age</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('age')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Age"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'gender',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Gender</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('gender')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Gender"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'income_range',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Income Range</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('income_range')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Income Range"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'education',
      header: () => (
        <div className="flex items-center justify-between">
          <span>Education</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('education')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete Education"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'url',
      header: () => (
        <div className="flex items-center justify-between">
          <span>URL</span>
          {onDeleteField && (
            <button
              onClick={() => onDeleteField('url')}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete URL"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
      cell: ({ getValue }) => (
        <a 
          href={getValue() as string} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {getValue() as string}
        </a>
      ),
    },
  ];

  // Convert custom columns to table columns
  const customTableColumns: ColumnDef<DataRow>[] = customColumns.map(col => ({
    accessorKey: col.field,
    header: () => (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span>{col.headerName}</span>
          {col.type === 'code' && (
            <Code className="h-3 w-3 text-blue-500" />
          )}
        </div>
        {onDeleteField && (
          <button
            onClick={() => onDeleteField(col.field)}
            className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title={`Delete ${col.headerName}`}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    ),
    cell: ({ getValue, row }) => {
      const value = getValue();
      
      if (col.type === 'checkbox') {
        return (
          <input 
            type="checkbox" 
            checked={!!value} 
            readOnly 
            className="h-4 w-4 text-blue-600"
          />
        );
      }
      
      if (col.type === 'code' && col.transform && col.sourceField) {
        try {
          const sourceValue = row.original[col.sourceField] || '';
          const transformFn = new Function('input', col.transform);
          const transformedValue = transformFn(sourceValue);
          return (
            <div className="flex flex-col">
              <span className="text-blue-600 font-mono text-sm">{String(transformedValue || '')}</span>
              <span className="text-xs text-gray-400">from {col.sourceField}</span>
            </div>
          );
        } catch (error) {
          return (
            <div className="flex flex-col">
              <span className="text-red-500 text-xs">ERR</span>
              <span className="text-xs text-gray-400">from {col.sourceField}</span>
            </div>
          );
        }
      }
      
      return <span>{String(value || '')}</span>;
    },
  }));

  // Filter out hidden fields from base columns
  const visibleBaseColumns = baseColumns.filter(col => 
    'accessorKey' in col && !hiddenFields.has(col.accessorKey as string)
  );

  // Combine base, dynamic, and custom columns
  const columns = [...visibleBaseColumns, ...dynamicColumns, ...customTableColumns];



  // Load initial CSV data
  useEffect(() => {
    async function loadData() {
      try {
        const data = await parseCSV('/sample.csv');
        setRowData(data);
      } catch (error) {
        console.error('Error loading CSV data:', error);
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, []);

  // Generate dynamic columns for webhook data
  useEffect(() => {
    if (previewData && previewData.length > 0) {
      // Check if this looks like webhook data (has _webhook_id field)
      const isWebhookData = previewData.some(row => row._webhook_id);
      
      if (isWebhookData) {
        // Get all unique field names from webhook data
        const allFields = new Set<string>();
        previewData.forEach(row => {
          Object.keys(row).forEach(key => {
            if (!key.startsWith('_webhook_')) { // Exclude webhook metadata
              allFields.add(key);
            }
          });
        });

        // Create dynamic columns for webhook fields
        const webhookColumns: ColumnDef<DataRow>[] = Array.from(allFields).map(field => ({
          accessorKey: field,
          header: () => (
            <div className="flex items-center justify-between">
              <span>{field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}</span>
              {onDeleteField && (
                <button
                  onClick={() => onDeleteField(field)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title={`Delete ${field}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ),
          cell: ({ getValue }: any) => {
            const value = getValue();
            return value ? String(value) : '';
          }
        }));

        setDynamicColumns(webhookColumns);
      } else {
        setDynamicColumns([]);
      }
    } else {
      setDynamicColumns([]);
    }
  }, [previewData, onDeleteField]);

  // Update data when preview data is available
  useEffect(() => {
    if (previewData && previewData.length > 0) {
      setRowData(previewData);
    }
  }, [previewData]);

  // Update row data when custom columns are added or removed
  useEffect(() => {
    setRowData(prevData => 
      prevData.map(row => {
        const updatedRow = { ...row };
        
        // Add new custom fields with empty values
        customColumns.forEach(col => {
          if (!(col.field in updatedRow)) {
            updatedRow[col.field] = '';
          }
        });
        
        // Remove deleted custom fields
        const customFieldNames = customColumns.map(col => col.field);
        Object.keys(updatedRow).forEach(key => {
          if (key.startsWith('custom_') && !customFieldNames.includes(key)) {
            delete updatedRow[key];
          }
        });
        
        return updatedRow;
      })
    );
  }, [customColumns]);

  const table = useReactTable({
    data: rowData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Preview Status */}
      {previewData && previewData.length > 0 && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">
                Preview Mode - {previewData.length} filtered results
              </span>
            </div>
            <span className="text-xs text-blue-600">
              Showing filtered data from Google Cloud Storage
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <span className="text-sm text-yellow-800">
              Loading preview data...
            </span>
          </div>
        </div>
      )}

      {/* Field Management Status */}
      {(customColumns.length > 0 || hiddenFields.size > 0) && (
        <div className="p-4 bg-green-50 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  Fields: {customColumns.filter(col => col.type !== 'code').length} custom, {customColumns.filter(col => col.type === 'code').length} code, {hiddenFields.size} hidden
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-700">
                <span>•</span>
                <span>Click the X icon in column headers to delete fields</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {customColumns.filter(col => col.type === 'code' && col.transform).length > 0 && (
                <button
                  onClick={runCodeTransforms}
                  disabled={runningCodeTransforms}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {runningCodeTransforms ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Running Transforms...
                    </>
                  ) : (
                    <>
                      <Code className="h-4 w-4" />
                      Run Code Transforms
                    </>
                  )}
                </button>
              )}
              {customColumns.filter(col => col.type !== 'code').length > 0 && (
                <button
                  onClick={runEnrichment}
                  disabled={enriching}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {enriching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Running Enrichment...
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      Run Enrichment
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>
              {' '}of{' '}
              <span className="font-medium">{table.getFilteredRowModel().rows.length}</span>
              {' '}results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
} 