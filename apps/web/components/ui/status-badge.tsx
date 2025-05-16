import { Badge } from '@kit/ui/badge';

export default function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case 'no data':
      return <Badge variant={'destructive'}>No Data</Badge>;
    case 'processing':
      return <Badge variant={'info'}>Processing</Badge>;
    case 'completed':
      return <Badge variant={'success'}>Completed</Badge>;
    case 'refreshing':
      return <Badge variant={'info'}>Refreshing</Badge>;
    case 'scheduled':
      return <Badge variant={'info'}>Scheduled</Badge>;
    case 'refreshed':
      return <Badge variant={'success'}>Refreshed</Badge>;
    case 'failed':
      return <Badge variant={'destructive'}>Failed</Badge>;
    default:
      return (
        <Badge variant={'secondary'} className="capitalize">
          {status.toLowerCase().replace(/[-_]/g, ' ')}
        </Badge>
      );
  }
}
