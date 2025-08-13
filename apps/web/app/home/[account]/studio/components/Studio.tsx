'use client';

import * as React from 'react';
import { PREDEFINED_SOURCES, PredefinedSource } from '~/lib/predefinedAudiences';

type FieldItem = { key: string; label: string; type: string; group: string };
type ApiFieldResponse = { fields: FieldItem[] };
type PreviewRow = Record<string, any>;

interface FilterRule {
  id: string;
  field: string;
  op: string;
  value: string | number | boolean;
}

const operators = [
  { value: '=', label: '=' },
  { value: '!=', label: '≠' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '≥' },
  { value: '<=', label: '≤' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'exists', label: 'exists' }
];

function FilterRuleComponent({ 
  rule, 
  fields, 
  onUpdate, 
  onDelete 
}: { 
  rule: FilterRule; 
  fields: FieldItem[]; 
  onUpdate: (rule: FilterRule) => void; 
  onDelete: () => void; 
}) {
  return (
    <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
      <select
        value={rule.field}
        onChange={(e) => onUpdate({ ...rule, field: e.target.value })}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">Select field...</option>
        {fields.map(field => (
          <option key={field.key} value={field.key}>
            {field.group === 'pixel_event' ? 'Pixel' : 'Contact'} • {field.label}
          </option>
        ))}
      </select>
      
      <select
        value={rule.op}
        onChange={(e) => onUpdate({ ...rule, op: e.target.value })}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">Select operator...</option>
        {operators.map(op => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
      
      {rule.op !== 'exists' && (
        <input
          type="text"
          value={rule.value as string}
          onChange={(e) => onUpdate({ ...rule, value: e.target.value })}
          placeholder="Value"
          className="border rounded px-2 py-1 text-sm flex-1"
        />
      )}
      
      <button
        onClick={onDelete}
        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
      >
        ✕
      </button>
    </div>
  );
}

export default function Studio() {
  // Dataset selection
  const [sourceId, setSourceId] = React.useState<'pixel_1'|'audience_1'>('pixel_1');
  const selectedSource = React.useMemo(
    () => PREDEFINED_SOURCES.find(s => s.id === sourceId)!,
    [sourceId]
  );

  // Fields + filters
  const [fields, setFields] = React.useState<FieldItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filterTree, setFilterTree] = React.useState<{
    combinator: 'and' | 'or';
    rules: FilterRule[];
  }>({
    combinator: 'and',
    rules: []
  });

  // Column picker
  const [search, setSearch] = React.useState('');
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);

  // Preview
  const [rows, setRows] = React.useState<PreviewRow[]>([]);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [lastLoadInfo, setLastLoadInfo] = React.useState<{rows:number; name:string; loaded_source?: string}|null>(null);

  // NEW: pagination state (server-driven)
  const [pageSize, setPageSize] = React.useState(50); // allow up to 300
  const [page, setPage] = React.useState(1);          // 1-based page counter

  // NEW: selection state (page-scoped)
  const [selectedRowIdx, setSelectedRowIdx] = React.useState<Set<number>>(new Set());

  // NEW: actions menu state
  const [actionKey, setActionKey] = React.useState<'extract_first' | ''>('');

  // Save segment
  const [savingSegment, setSavingSegment] = React.useState(false);

  // Track if component has mounted to avoid hydration issues
  const [hasMounted, setHasMounted] = React.useState(false);

  // Set mounted flag on client side
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  // when page changes, clear page selections
  React.useEffect(() => {
    setSelectedRowIdx(new Set());
  }, [page, pageSize]);

  // derive limit/offset for API
  const limit = Math.min(300, Math.max(1, pageSize));
  const offset = (Math.max(1, page) - 1) * limit;

  // Load field catalog on mount (static, no data loading)
  React.useEffect(() => {
    if (hasMounted) {
      loadFieldCatalog();
    }
  }, [hasMounted]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Helper to load field catalog (static, no data loading)
  const loadFieldCatalog = async () => {
    setLoading(true);
    try {
      // Refresh field catalog from server (always the same unified list)
      const rf = await fetch('/api/studio/filters/fields');
      const df = await rf.json();
      setFields(df.fields || []);
    } catch (error) {
      console.error('Failed to load field catalog:', error);
      alert(`Failed to load field catalog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter available fields based on search and selected state
  const available = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return fields
      .filter(f => !selectedKeys.includes(f.key))
      .filter(f => !q || f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q));
  }, [fields, selectedKeys, search]);

  // Get selected field objects
  const selected = React.useMemo(
    () => selectedKeys.map(k => fields.find(f => f.key === k)).filter(Boolean) as FieldItem[],
    [selectedKeys, fields]
  );

  // Column picker actions
  const addAll = () => setSelectedKeys(fields.map(f => f.key));
  const clearAll = () => setSelectedKeys([]);
  const addKey = (k: string) => setSelectedKeys(prev => prev.includes(k) ? prev : [...prev, k]);
  const removeKey = (k: string) => setSelectedKeys(prev => prev.filter(x => x !== k));

  // Boolean builder actions
  const addRule = () => {
    const newRule: FilterRule = {
      id: Math.random().toString(36).substr(2, 9),
      field: '',
      op: '',
      value: ''
    };
    setFilterTree({
      ...filterTree,
      rules: [...filterTree.rules, newRule]
    });
  };

  const updateRule = (ruleId: string, updatedRule: FilterRule) => {
    setFilterTree({
      ...filterTree,
      rules: filterTree.rules.map(r => r.id === ruleId ? updatedRule : r)
    });
  };

  const deleteRule = (ruleId: string) => {
    setFilterTree({
      ...filterTree,
      rules: filterTree.rules.filter(r => r.id !== ruleId)
    });
  };

  // ---- Utility: extract first value from multi-value strings ----
  function firstOfMulti(val: any): any {
    if (val == null) return val;

    // If looks like a JSON array string: ["x","y"]
    if (typeof val === 'string') {
      const t = val.trim();

      // Try JSON array parse safely
      if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('"[') || t.endsWith(']"'))) {
        try {
          const parsed = JSON.parse(t.replace(/^"|"$/g, ''));
          if (Array.isArray(parsed) && parsed.length) {
            const first = parsed[0];
            return typeof first === 'string' ? first.trim() : first;
          }
        } catch {/* fall through */}
      }

      // Split by common delimiters , ; |
      if (t.includes(',') || t.includes(';') || t.includes('|')) {
        const parts = t.split(/[;,|]/).map(s => s.trim()).filter(Boolean);
        if (parts.length) return parts[0];
      }
    }

    // default: unchanged
    return val;
  }

  // ---- Action runner ----
  function extractFirstValuesOnSelectedRows() {
    if (!selectedRowIdx.size) return;

    setRows(prev => {
      const next = [...prev];
      selectedRowIdx.forEach(i => {
        const row = next[i];
        if (!row) return;
        const updated: PreviewRow = {};
        for (const k of Object.keys(row)) {
          updated[k] = firstOfMulti(row[k]);
        }
        next[i] = updated;
      });
      return next;
    });
  }

  function runSelectedAction() {
    if (actionKey === 'extract_first') {
      extractFirstValuesOnSelectedRows();
    }
    // reset action selection (optional)
    setActionKey('');
  }

  // header checkbox logic (select all on page)
  const allOnPageSelected = rows.length > 0 && rows.every((_, i) => selectedRowIdx.has(i));
  const someOnPageSelected = rows.some((_, i) => selectedRowIdx.has(i)) && !allOnPageSelected;

  const toggleHeaderCheckbox = () => {
    if (allOnPageSelected) {
      // unselect all on page
      setSelectedRowIdx(prev => {
        const next = new Set(prev);
        rows.forEach((_, i) => next.delete(i));
        return next;
      });
    } else {
      // select all on page
      setSelectedRowIdx(prev => {
        const next = new Set(prev);
        rows.forEach((_, i) => next.add(i));
        return next;
      });
    }
  };

  const toggleRow = (i: number) => {
    setSelectedRowIdx(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      // Convert our internal format to API format
      const apiFilterTree = {
        combinator: filterTree.combinator,
        rules: filterTree.rules.map(rule => ({
          field: rule.field,
          op: rule.op,
          value: rule.value
        })).filter(rule => rule.field && rule.op) // Only include complete rules
      };

      const payload = {
        audience: { 
          url: selectedSource.url, 
          format: selectedSource.format 
        },
        filterTree: apiFilterTree,
        select: selectedKeys, // Send selected columns
        limit,
        offset
      };

      console.log('Sending payload to unified preview:', payload);

      const r = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await r.json();
      
      if (r.ok) {
        setRows(data.rows || []);
        setLastLoadInfo({ 
          rows: data.total_rows || data.rows?.length || 0, 
          name: selectedSource.name,
          loaded_source: data.loaded
        });
      } else {
        console.error('Preview failed:', data);
        alert(`Preview failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert('Preview failed: Network error');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Save segment functionality
  const saveSegment = async () => {
    const name = window.prompt('Segment name? (e.g., "High Intent")');
    if (!name) return;

    // Check if we have any rules
    const validRules = filterTree.rules.filter(rule => rule.field && rule.op);
    if (validRules.length === 0) {
      alert('Please add at least one filter rule before saving a segment.');
      return;
    }

    setSavingSegment(true);
    try {
      // Convert our internal format to API format
      const apiFilterTree = {
        combinator: filterTree.combinator,
        rules: validRules.map(rule => ({
          field: rule.field,
          op: rule.op,
          value: rule.value
        }))
      };

      const payload = {
        name,
        parent_audience_id: sourceId, // Use the current source ID
        source_url: selectedSource.url,
        format: selectedSource.format,
        filterTree: apiFilterTree,
        selectedFields: selectedKeys
      };

      console.log('Saving segment with payload:', payload);

      const r = await fetch('/api/studio/segments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', r.status);
      const data = await r.json();
      console.log('Response data:', data);
      
      if (r.ok) {
        alert(`Saved: ${data.segment.name}`);
      } else {
        console.error('Save failed:', data);
        alert(`Failed to save: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save segment error:', error);
      alert(`Failed to save segment: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setSavingSegment(false);
    }
  };

  // Show loading state until component has mounted
  if (!hasMounted) {
    return <div className="p-6">Loading...</div>;
  }

  if (loading && fields.length === 0) return <div className="p-6">Loading field catalog…</div>;

  // columns (as before)
  const cols = rows.length && rows[0] ? Object.keys(rows[0]) : (selected.length ? selected.map(s => s.key) : []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dataset • Filters • Visible Fields</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/home/test/studio/audiences'}
            className="px-3 py-2 rounded border hover:bg-gray-50 text-sm"
          >
            View Saved Segments
          </button>
        </div>
      </div>

      {/* 0) Choose dataset (no Load button) */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium">0) Choose Dataset</h2>
        <div className="flex items-center gap-3">
          <select
            value={sourceId}
            onChange={e => setSourceId(e.target.value as 'pixel_1'|'audience_1')}
            className="border rounded px-3 py-2"
          >
            {PREDEFINED_SOURCES.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.kind})
              </option>
            ))}
          </select>
          {lastLoadInfo && (
            <div className="text-sm text-gray-600">
              Loaded: <b>{lastLoadInfo.name}</b> • Rows: <b>{lastLoadInfo.rows}</b>
              {lastLoadInfo.loaded_source && (
                <span className="ml-2 text-blue-600">
                  • Cached: {lastLoadInfo.loaded_source.substring(0, 20)}...
                </span>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Data will only be loaded when you click Preview. Pixel 1 has fields Audience 1 does not. Missing fields appear as empty cells; filters remain stable (unified catalog).
        </p>
      </div>

      {/* 1) Boolean editor */}
      <div className="rounded-lg border p-4">
        <h2 className="font-medium mb-3">1) Build Filters</h2>
        <div className="flex items-center gap-2 mb-4">
          <select
            value={filterTree.combinator}
            onChange={(e) => setFilterTree({ ...filterTree, combinator: e.target.value as 'and' | 'or' })}
            className="border rounded px-2 py-1 text-sm font-medium"
          >
            <option value="and">AND</option>
            <option value="or">OR</option>
          </select>
          
          <button
            onClick={addRule}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Add Rule
          </button>
        </div>

        <div className="space-y-2">
          {filterTree.rules.map(rule => (
            <FilterRuleComponent
              key={rule.id}
              rule={rule}
              fields={fields}
              onUpdate={(updatedRule) => updateRule(rule.id, updatedRule)}
              onDelete={() => deleteRule(rule.id)}
            />
          ))}
          
          {filterTree.rules.length === 0 && (
            <div className="text-gray-500 text-sm p-4 text-center">
              No rules added yet. Click "Add Rule" to get started.
            </div>
          )}
        </div>
      </div>

      {/* 2) Column picker */}
      <div className="rounded-lg border p-4">
        <h2 className="font-medium mb-3">2) Choose Visible Fields</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <input
                placeholder="Search fields…"
                className="border rounded px-2 py-1 w-full"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button 
                className="px-2 py-1 border rounded text-sm hover:bg-gray-50" 
                onClick={addAll}
              >
                Select All
              </button>
            </div>
            <div className="h-64 overflow-auto text-sm">
              {available.map(f => (
                <button
                  key={f.key}
                  onClick={() => addKey(f.key)}
                  className="w-full text-left px-2 py-1 hover:bg-gray-50 border-b"
                  title={f.key}
                >
                  {f.group === 'pixel_event' ? 'Pixel' : 'Contact'} • {f.label}
                </button>
              ))}
              {!available.length && (
                <div className="text-gray-500 px-2 py-6 text-center">No fields</div>
              )}
            </div>
          </div>
          <div className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm">Selected ({selected.length})</div>
              <button 
                className="px-2 py-1 border rounded text-sm hover:bg-gray-50" 
                onClick={clearAll}
              >
                Clear
              </button>
            </div>
            <div className="h-64 overflow-auto text-sm">
              {selected.map(f => (
                <div key={f.key} className="flex items-center justify-between px-2 py-1 border-b">
                  <div title={f.key} className="flex-1">
                    {f.group === 'pixel_event' ? 'Pixel' : 'Contact'} • {f.label}
                  </div>
                  <button 
                    className="text-red-600 text-xs hover:bg-red-50 px-1 rounded" 
                    onClick={() => removeKey(f.key)}
                  >
                    remove
                  </button>
                </div>
              ))}
              {!selected.length && (
                <div className="text-gray-500 px-2 py-6 text-center">
                  No fields selected — Preview shows all.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button 
            onClick={saveSegment}
            disabled={savingSegment || filterTree.rules.filter(r => r.field && r.op).length === 0}
            className="px-3 py-2 rounded border hover:bg-gray-50 disabled:opacity-60"
            title={`savingSegment: ${savingSegment}, validRules: ${filterTree.rules.filter(r => r.field && r.op).length}`}
          >
            {savingSegment ? 'Saving...' : 'Save Segment'}
          </button>
        </div>
      </div>

      {/* Controls above preview */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm">Rows per page</label>
          <select
            className="border rounded px-2 py-1"
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {[25,50,100,200,300].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => { if (page > 1) { setPage(p => p-1); handlePreview(); } }}
            disabled={page <= 1}
          >
            Prev
          </button>
          <div className="text-sm">Page {page}</div>
          <button
            className="px-2 py-1 border rounded"
            onClick={() => { setPage(p => p+1); handlePreview(); }}
          >
            Next
          </button>
          <button
            className="px-3 py-2 rounded bg-black text-white"
            onClick={handlePreview}
            disabled={previewLoading}
          >
            {previewLoading ? 'Loading...' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Preview table with selector column */}
      <div className="rounded border">
        <div className="px-4 py-2 text-sm text-gray-600 flex items-center gap-3">
          Preview ({rows.length} rows on this page)
          <span className="text-gray-400">•</span>
          Selected on page: <b>{selectedRowIdx.size}</b>

          {/* Existing "Unselect all" */}
          <button
            className="ml-2 text-xs underline text-gray-600"
            onClick={() => setSelectedRowIdx(new Set())}
          >
            Unselect all on page
          </button>

          {/* NEW: Actions dropdown & Run button (visible only if selection exists) */}
          {selectedRowIdx.size > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <label className="text-sm">Actions</label>
                <select
                  className="border rounded px-2 py-1"
                  value={actionKey}
                  onChange={e => setActionKey(e.target.value as any)}
                >
                  <option value="">Choose…</option>
                  <option value="extract_first">Extract Values (first item only)</option>
                </select>
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  onClick={runSelectedAction}
                  disabled={!actionKey}
                >
                  Run
                </button>
              </div>
            </>
          )}
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {/* selector header */}
                <th className="px-2 py-2 w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={allOnPageSelected}
                    ref={el => { if (el) el.indeterminate = someOnPageSelected; }}
                    onChange={toggleHeaderCheckbox}
                  />
                </th>
                {cols.map(c => (
                  <th key={c} className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selectedRowIdx.has(i)}
                      onChange={() => toggleRow(i)}
                      aria-label={`Select row ${i+1}`}
                    />
                  </td>
                  {cols.map(c => (
                    <td key={c} className="px-3 py-2 whitespace-nowrap">
                      {(() => {
                        const value = r[c];
                        if (value === null || value === undefined) return '';
                        if (typeof value === 'object') return JSON.stringify(value);
                        return String(value);
                      })()}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr><td className="px-3 py-6 text-gray-500" colSpan={cols.length + 1}>No rows. Click Preview.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <details className="rounded border p-3">
        <summary className="cursor-pointer text-sm text-gray-700">
          Debug: current filterTree JSON
        </summary>
        <pre className="text-xs overflow-auto mt-2 bg-gray-50 p-2 rounded">
          {JSON.stringify({ filterTree, selectedKeys, sourceId, page, pageSize, selectedRowCount: selectedRowIdx.size }, null, 2)}
        </pre>
      </details>
    </div>
  );
}