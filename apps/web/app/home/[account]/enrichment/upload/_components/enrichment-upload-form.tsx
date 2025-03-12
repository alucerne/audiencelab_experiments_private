'use client';

import { useState } from 'react';

import { CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';

import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Button } from '@kit/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import FileDropZone from '~/components/ui/file-dropzone';
import { TeamAccountLayoutPageHeader } from '~/home/[account]/_components/team-account-layout-page-header';

export default function EnrichmentUploadForm() {
  const {
    account: { slug },
  } = useTeamAccountWorkspace();

  const [csvData, setCsvData] = useState<Array<Record<string, string>> | null>(
    null,
  );
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string[]>>(
    {},
  );
  const [detectedDataRows, setDetectedDataRows] = useState(0);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(
    {},
  );

  function handleFileChange(file: File) {
    if (file) {
      Papa.parse<Record<string, string>>(file, {
        complete: (result) => {
          if (result.meta.fields) {
            setCsvData(result.data);
            const headers = result.meta.fields;
            const samples = result.data
              .slice(0, 4)
              .map((row) => headers.map((header) => row[header] || ''));

            setCsvHeaders(headers);
            setSampleData(samples);
            setDetectedDataRows(result.data.length - 1);

            calculateHeaderCompleteness(headers, result.data);
          } else {
            console.error('No headers found in CSV file');
          }
        },
        header: true,
      });
    }
  }

  const [headerCompleteness, setHeaderCompleteness] = useState<
    Record<string, number>
  >({});

  function calculateHeaderCompleteness(
    headers: string[],
    data: Array<Record<string, string>>,
  ) {
    const completeness: Record<string, number> = {};

    headers.forEach((header) => {
      const nonNullCount = data.filter(
        (row) =>
          row[header] !== null &&
          row[header] !== undefined &&
          row[header].trim() !== '',
      ).length;

      const percentage =
        data.length > 0 ? (nonNullCount / data.length) * 100 : 0;
      completeness[header] = Math.round(percentage);
    });

    setHeaderCompleteness(completeness);
  }

  function handleFileRemove() {
    setCsvData(null);
    setCsvHeaders([]);
    setSampleData([]);
    setColumnMapping({});
    setDetectedDataRows(0);
    setSelectedFields({});
    setHeaderCompleteness({});
  }

  function handleSelectChange(csvHeader: string, selectedField: string) {
    let previouslySelectedField: string | null = null;

    Object.entries(columnMapping).forEach(([field, headers]) => {
      if (headers.includes(csvHeader)) {
        previouslySelectedField = field;
      }
    });

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

    setSelectedFields((prev) => {
      const newSelectedFields = { ...prev };

      if (
        previouslySelectedField &&
        previouslySelectedField !== 'doNotImport'
      ) {
        const stillInUse = Object.entries(columnMapping).some(
          ([field, headers]) => {
            return (
              field === previouslySelectedField &&
              headers.some((h) => h !== csvHeader)
            );
          },
        );

        if (!stillInUse) {
          newSelectedFields[previouslySelectedField] = false;
        }
      }

      if (selectedField !== 'doNotImport') {
        newSelectedFields[selectedField] = true;
      }

      return newSelectedFields;
    });
  }

  function getSelectedValueForHeader(header: string): string | undefined {
    let selectedValue: string | undefined;

    Object.entries(columnMapping).forEach(([field, headers]) => {
      if (headers.includes(header)) {
        selectedValue = field;
      }
    });

    return selectedValue;
  }

  const fieldOptions = [
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'name', label: 'Full Name' },
    { value: 'email', label: 'Email' },
    { value: 'domain', label: 'Domain' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'title', label: 'Job Title' },
    { value: 'company', label: 'Company' },
    { value: 'doNotImport', label: 'Do Not Import' },
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <TeamAccountLayoutPageHeader
          account={slug}
          title="Enrichment"
          description={<AppBreadcrumbs />}
        />
        <div className="mx-auto w-full max-w-5xl">
          <h3 className="mb-4 text-xl font-semibold">Upload CSV File</h3>
          <FileDropZone
            onFileChange={handleFileChange}
            onFileRemove={handleFileRemove}
            accept=".csv"
          />
          {csvHeaders.length > 0 && (
            <>
              <h3 className="mt-8 mb-4 text-xl font-semibold">
                Map CSV Columns to Fields
              </h3>
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="font-bold">Column Name</div>
                <div className="font-bold">Select Type</div>
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
                        getSelectedValueForHeader(header) !== 'doNotImport' && (
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
                    <Select
                      value={getSelectedValueForHeader(header)}
                      onValueChange={(selectedValue) =>
                        handleSelectChange(header, selectedValue)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldOptions
                          .filter(
                            (option) =>
                              option.value === 'doNotImport' ||
                              columnMapping[option.value]?.includes(header) ||
                              (!selectedFields[option.value] &&
                                option.value !== 'doNotImport'),
                          )
                          .map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
      <div className="bg-background flex-none border-t py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-6">
          {csvHeaders.length > 0 && (
            <span className="text-sm">
              Detected {detectedDataRows.toLocaleString()} rows
            </span>
          )}
          <Button
            disabled={!csvData}
            onClick={() =>
              toast.error('still need to integrate api, just showing ui')
            }
          >
            Submit Enrichment
          </Button>
        </div>
      </div>
    </>
  );
}
