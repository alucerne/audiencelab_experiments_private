import { BarChart2, Boxes, Copy, Trash2 } from 'lucide-react';

import { Card, CardHeader, CardTitle } from '@kit/ui/card';

const actions = [
  { icon: <BarChart2 className="size-4" />, label: 'See Resolutions' },
  { icon: <Copy className="size-4" />, label: 'Install' },
  { icon: <Boxes className="size-4" />, label: 'Webhook' },
  { icon: <Trash2 className="size-4" />, label: 'Delete' },
];

export function PixelActionsBox() {
  return (
    <Card className="rounded-lg border-0 border-l-4 border-blue-600 bg-blue-50 p-4 dark:border-blue-400 dark:bg-slate-800">
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-200">
          Available Pixel Actions
        </CardTitle>
      </CardHeader>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3">
        {actions.map(({ icon, label }) => (
          <button
            key={label}
            className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-400"
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
