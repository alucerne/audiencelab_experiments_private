'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  Check,
  CheckCircle,
  ChevronsUpDown,
  Signpost,
  Upload,
} from 'lucide-react';
import * as Papa from 'papaparse';
import { toast } from 'sonner';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Button } from '@kit/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@kit/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@kit/ui/popover';
import { cn } from '@kit/ui/utils';

import FileDropZone from '~/components/ui/file-dropzone';
import pathsConfig from '~/config/paths.config';
import { TeamAccountLayoutPageHeader } from '~/home/[account]/_components/team-account-layout-page-header';

import {
  getUploadUrlAction,
  processEnrichmentAction,
} from '../_lib/server-actions';
import EnrichmentNameDialog from './enrichment-name-dialog';

type FieldOption =
  | 'FIRST_NAME'
  | 'LAST_NAME'
  | 'EMAIL'
  | 'PHONE'
  | 'PERSONAL_ADDRESS'
  | 'PERSONAL_ZIP'
  | 'PERSONAL_STATE'
  | 'PERSONAL_CITY'
  | 'COMPANY_INDUSTRY'
  | 'SHA256_PERSONAL_EMAIL'
  | 'LINKEDIN_URL'
  | 'UP_ID'
  | 'PERSONAL_EMAIL'
  | 'BUSINESS_EMAIL'
  | 'COMPANY_NAME'
  | 'COMPANY_DOMAIN'
  | 'DO_NOT_IMPORT';

const fieldOptions: {
  value: FieldOption;
  label: string;
}[] = [
  { value: 'FIRST_NAME', label: 'First Name' },
  { value: 'LAST_NAME', label: 'Last Name' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone Number' },
  { value: 'PERSONAL_ADDRESS', label: 'Personal Address' },
  { value: 'PERSONAL_ZIP', label: 'Personal Zip' },
  { value: 'PERSONAL_STATE', label: 'Personal State' },
  { value: 'PERSONAL_CITY', label: 'Personal City' },
  { value: 'COMPANY_INDUSTRY', label: 'Company Industry' },
  { value: 'SHA256_PERSONAL_EMAIL', label: 'SHA256 Personal Email' },
  { value: 'LINKEDIN_URL', label: 'LinkedIn URL' },
  { value: 'UP_ID', label: 'UP ID' },
  { value: 'PERSONAL_EMAIL', label: 'Personal Email' },
  { value: 'BUSINESS_EMAIL', label: 'Business Email' },
  { value: 'COMPANY_NAME', label: 'Company Name' },
  { value: 'COMPANY_DOMAIN', label: 'Company Domain' },
  { value: 'DO_NOT_IMPORT', label: 'Do Not Import' },
];

export default function EnrichmentUploadForm({
  sizeLimit,
}: {
  sizeLimit: number;
}) {
  const router = useRouter();

  const {
    account: { slug, id: accountId },
  } = useTeamAccountWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string[]>>(
    {},
  );
  const [openPopover, setOpenPopover] = useState<Record<string, boolean>>({});
  const [headerCompleteness, setHeaderCompleteness] = useState<
    Record<string, number>
  >({});
  const [rowCount, setRowCount] = useState<number>(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  function validate() {
    const hasValidMapping = Object.entries(columnMapping).some(
      ([field, headers]) => {
        return field !== 'DO_NOT_IMPORT' && headers.length > 0;
      },
    );

    if (!hasValidMapping) {
      toast.error('Please map at least one column to a field.');
      return false;
    }

    if (!currentFile) {
      toast.error('File not found. Please try uploading again.');
      return false;
    }

    return true;
  }

  async function handleEnrichmentSubmit(
    enrichmentName: string,
    operator: 'OR' | 'AND',
  ) {
    if (!validate() || !currentFile) return;

    setIsSubmitting(true);
    toast.promise(
      async () => {
        const headerToFieldMap: Record<string, string> = {};
        Object.entries(columnMapping).forEach(([field, headers]) => {
          if (field !== 'DO_NOT_IMPORT') {
            headers.forEach((header) => {
              headerToFieldMap[header] = field;
            });
          }
        });

        const headersToKeep = Object.keys(headerToFieldMap);

        const transformedChunks: string[] = [];
        let isFirstChunk = true;

        await new Promise<void>((resolve, reject) => {
          Papa.parse<Record<string, string>>(currentFile, {
            header: true,
            skipEmptyLines: true,
            chunk: (results) => {
              const chunkData = results.data as Record<string, string>[];
              const transformedRows: Record<string, string>[] = [];

              chunkData.forEach((row) => {
                const transformedRow: Record<string, string> = {};
                headersToKeep.forEach((originalHeader) => {
                  const mappedField = headerToFieldMap[originalHeader];
                  if (mappedField) {
                    transformedRow[mappedField] = row[originalHeader] || '';
                  }
                });
                transformedRows.push(transformedRow);
              });

              const csvContent = isFirstChunk
                ? Papa.unparse(transformedRows, { header: true })
                : Papa.unparse(transformedRows, { header: false });
              isFirstChunk = false;
              transformedChunks.push(csvContent);
            },
            complete: () => resolve(),
            error: reject,
          });
        });

        let finalCsv = transformedChunks[0] || '';
        for (let i = 1; i < transformedChunks.length; i++) {
          const lines = transformedChunks[i]?.split('\n');
          if (lines && lines.length > 1) {
            finalCsv += '\n' + lines.slice(1).join('\n');
          }
        }

        finalCsv = finalCsv
          .split('\n')
          .filter((line) => line.trim() !== '')
          .join('\n');

        const transformedBlob = new Blob([finalCsv], { type: 'text/csv' });
        const transformedFile = new File([transformedBlob], currentFile.name, {
          type: 'text/csv',
          lastModified: new Date().getTime(),
        });

        const { signedUrl, uniqueFileName, jobId } = await getUploadUrlAction({
          fileName: transformedFile.name,
          fileType: transformedFile.type,
          accountId,
          name: enrichmentName,
        });

        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': transformedFile.type,
          },
          body: transformedFile,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(
            `Upload failed: ${uploadResponse.status} ${errorText}`,
          );
        }

        await processEnrichmentAction({
          uniqueFileName,
          accountId,
          jobId,
          columnMapping,
          originalFileName: currentFile.name,
          operator,
        });
      },
      {
        loading: 'Preparing data for enrichment...',
        success: () => {
          setIsSubmitting(false);
          router.push(
            pathsConfig.app.accountEnrichment.replace('[account]', slug),
          );

          return 'Data uploaded successfully and queued for enrichment.';
        },
        error: () => {
          setIsSubmitting(false);
          return 'Error preparing data for enrichment.';
        },
      },
    );
  }

  function handleFileChange(file: File) {
    setCsvHeaders([]);
    setSampleData([]);
    setColumnMapping({});
    setHeaderCompleteness({});
    setRowCount(0);
    setIsProcessing(true);
    setCurrentFile(file);

    let headers: string[] = [];
    const sampleRows: string[][] = [];
    let tempRowCount = 0;
    const completenessTracker: Record<
      string,
      { filled: number; total: number }
    > = {};

    Papa.parse(file, {
      header: true,
      chunk: (results) => {
        const chunkData = results.data as Record<string, string>[];

        if (tempRowCount === 0 && results.meta.fields) {
          headers = results.meta.fields;
          setCsvHeaders(headers);

          headers.forEach((header) => {
            completenessTracker[header] = { filled: 0, total: 0 };
          });

          const autoMapping: Record<string, string[]> = {};

          headers.forEach((header) => {
            const normalizedHeader = header
              .toLowerCase()
              .replace(/[_\s]+/g, '');

            const matchedOption = fieldOptions.find((option) => {
              const normalizedOption = option.label
                .toLowerCase()
                .replace(/[_\s]+/g, '');
              return normalizedHeader === normalizedOption;
            });

            if (matchedOption) {
              autoMapping[matchedOption.value] = [header];
            }
          });

          setColumnMapping(autoMapping);
        }

        if (headers.length === 0) return;

        chunkData.forEach((row) => {
          const isEmptyRow = headers.every(
            (header) => !row[header] || row[header].trim() === '',
          );
          if (isEmptyRow) return;

          tempRowCount++;

          if (sampleRows.length < 4) {
            sampleRows.push(headers.map((header) => row[header] || ''));
          }

          headers.forEach((header) => {
            if (!completenessTracker[header]) {
              completenessTracker[header] = { filled: 0, total: 0 };
            }
            completenessTracker[header].total++;
            if (row[header] && row[header].trim() !== '') {
              completenessTracker[header].filled++;
            }
          });
        });

        if (tempRowCount % 10000 === 0) {
          setRowCount(tempRowCount);
        }
      },
      complete: () => {
        if (tempRowCount > sizeLimit) {
          toast.error(
            `File exceeds row limit of ${sizeLimit.toLocaleString()} rows. Please upload a smaller file.`,
          );
          handleFileRemove();
          setIsProcessing(false);
          return;
        }

        const headerCompleteness: Record<string, number> = {};
        Object.entries(completenessTracker).forEach(([header, counts]) => {
          headerCompleteness[header] =
            counts.total > 0
              ? Math.round((counts.filled / counts.total) * 100)
              : 0;
        });

        setSampleData(sampleRows);
        setHeaderCompleteness(headerCompleteness);
        setRowCount(tempRowCount);
        setIsProcessing(false);
        toast.success(
          `Successfully processed ${(tempRowCount - 1).toLocaleString()} rows.`,
        );
      },
      error: () => {
        toast.error(`Error processing file. Please try again.`);
        setIsProcessing(false);
      },
    });
  }

  function handleFileRemove() {
    setCsvHeaders([]);
    setSampleData([]);
    setColumnMapping({});
    setHeaderCompleteness({});
    setRowCount(0);
    setCurrentFile(null);
  }

  function handleSelectChange(csvHeader: string, selectedField: FieldOption) {
    setColumnMapping((prevMapping) => {
      const newMapping = { ...prevMapping };

      Object.keys(newMapping).forEach((key) => {
        if (newMapping[key]) {
          newMapping[key] = newMapping[key].filter(
            (header) => header !== csvHeader,
          );
        }
      });

      if (!newMapping[selectedField]) {
        newMapping[selectedField] = [];
      }
      newMapping[selectedField].push(csvHeader);

      return newMapping;
    });

    setOpenPopover((prev) => ({
      ...prev,
      [csvHeader]: false,
    }));
  }

  function getSelectedValueForHeader(header: string) {
    let selectedValue: string | undefined;

    Object.entries(columnMapping).forEach(([field, headers]) => {
      if (headers.includes(header)) {
        selectedValue = field;
      }
    });

    return selectedValue;
  }

  function getSelectedLabelForHeader(header: string) {
    const value = getSelectedValueForHeader(header);
    if (!value) return 'Select field';

    const option = fieldOptions.find((opt) => opt.value === value);
    return option ? option.label : 'Select field';
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <TeamAccountLayoutPageHeader
          account={slug}
          title="Enrichment"
          description={<AppBreadcrumbs />}
        />
        <div className="mx-auto w-full max-w-5xl lg:px-4">
          <h3 className="mb-4 flex gap-2 text-xl font-semibold">
            <Upload />
            Upload CSV File
          </h3>
          <FileDropZone
            onFileChange={handleFileChange}
            onFileRemove={handleFileRemove}
            accept=".csv"
            file={currentFile}
          />
          {isProcessing && currentFile && (
            <div className="my-40 flex flex-col items-center justify-center gap-3">
              <p className="text-muted-foreground max-w-md text-center text-sm">
                Processing your file. This may take a few moments for large
                files...
              </p>
            </div>
          )}
          {!isProcessing && csvHeaders.length > 0 && (
            <>
              <h3 className="mt-8 mb-4 flex gap-2 text-xl font-semibold">
                <Signpost />
                Map CSV Columns to Fields
              </h3>
              <div className="mb-4 grid grid-cols-3 gap-4 max-sm:hidden">
                <div className="font-bold">Column Name</div>
                <div className="font-bold">Select Fields</div>
                <div className="font-bold">Samples</div>
              </div>
              {csvHeaders.map((header, index) => (
                <div
                  key={header}
                  className={`grid items-start gap-3 border-b py-4 sm:mb-2 sm:grid-cols-3 sm:gap-6 ${
                    index === 0 ? 'border-t' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center">
                      {getSelectedValueForHeader(header) &&
                        getSelectedValueForHeader(header) !==
                          'DO_NOT_IMPORT' && (
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        )}
                      <span>{header}</span>
                    </div>
                    {headerCompleteness[header] !== undefined && (
                      <div className="mt-1 text-xs text-slate-500">
                        {headerCompleteness[header]}% complete
                      </div>
                    )}
                  </div>
                  <div>
                    <Popover
                      open={openPopover[header] || false}
                      onOpenChange={(open) => {
                        setOpenPopover((prev) => ({ ...prev, [header]: open }));
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between',
                            !getSelectedValueForHeader(header) &&
                              'text-muted-foreground',
                          )}
                        >
                          {getSelectedLabelForHeader(header)}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search fields..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No field found.</CommandEmpty>
                            <CommandGroup>
                              {fieldOptions
                                .filter(
                                  (option) =>
                                    option.value === 'DO_NOT_IMPORT' ||
                                    !columnMapping[option.value] ||
                                    columnMapping[option.value]?.length === 0 ||
                                    columnMapping[option.value]?.includes(
                                      header,
                                    ),
                                )
                                .map((option) => (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() =>
                                      handleSelectChange(header, option.value)
                                    }
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        getSelectedValueForHeader(header) ===
                                          option.value
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                    {option.label}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    {sampleData.map((sample, sampleIndex) => (
                      <div key={sampleIndex} className="truncate font-semibold">
                        {sample[index] !== '' ? sample[index] : <br />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="bg-background flex-none border-t py-4 lg:px-4">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-6">
          {rowCount > 0 && !isProcessing && (
            <span className="text-sm">
              {`Detected ${(rowCount - 1).toLocaleString()} rows`}
            </span>
          )}
          <EnrichmentNameDialog
            onSubmit={handleEnrichmentSubmit}
            disabled={!currentFile || isProcessing || isSubmitting}
            onBeforeOpen={validate}
          />
        </div>
      </div>
    </>
  );
}
