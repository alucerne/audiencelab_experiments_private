import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';

const enrichmentNameSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'Enrichment name must be at least 2 characters.',
    })
    .max(50, {
      message: "Enrichment name can't exceed 50 characters.",
    }),
});

type EnrichmentNameFormValues = z.infer<typeof enrichmentNameSchema>;

export default function EnrichmentNameDialog({
  onSubmit,
  disabled,
  onBeforeOpen,
}: {
  onSubmit: (name: string) => void;
  disabled?: boolean;
  onBeforeOpen?: () => boolean;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<EnrichmentNameFormValues>({
    resolver: zodResolver(enrichmentNameSchema),
    defaultValues: {
      name: '',
    },
  });

  function handleSubmit(values: EnrichmentNameFormValues) {
    onSubmit(values.name);
    form.reset();
    setOpen(false);
  }

  function handleOpenChange(isOpen: boolean) {
    if (isOpen && onBeforeOpen) {
      const shouldOpen = onBeforeOpen();
      if (!shouldOpen) {
        return;
      }
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>Submit Enrichment</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start Enrichment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enrichment Name</FormLabel>
                  <FormDescription>
                    Name your enrichment for later use.
                  </FormDescription>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Create
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
