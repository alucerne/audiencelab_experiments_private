'use client';

import { useTransition } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Label } from '@kit/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

type Team = {
  id: string;
  name: string;
};

export function TeamFilterSelect({ teams }: { teams: Team[] }) {
  console.log('TeamFilterSelect rendered with teams:', teams);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selectedTeamId = searchParams.get('client') || '__all__';

  const handleTeamChange = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === '__all__') {
        params.delete('client');
      } else {
        params.set('client', value);
      }
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="w-full sm:w-[250px]">
      <Label htmlFor="team-select" className="mb-1 block text-sm font-medium">
        Filter by Team
      </Label>
      <Select
        onValueChange={handleTeamChange}
        value={selectedTeamId}
        disabled={isPending || teams.length === 0}
      >
        <SelectTrigger id="team-select">
          <SelectValue placeholder="All Teams" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Teams</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
