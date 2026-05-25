import React from 'react';
import { Button } from '@/components/ui/button';

interface HandoffButtonProps {
  agentId: string;
  payload: Record<string, any>;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

export const HandoffButton: React.FC<HandoffButtonProps> = ({ agentId, payload, onSuccess, onError }) => {
  const handleClick = async () => {
    try {
      const res = await fetch(`/ia_scrum_team/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, payload }),
      });
      if (!res.ok) {
        const err = new Error(`Handoff failed: ${res.statusText}`);
        if (onError) onError(err);
        return;
      }
      if (onSuccess) onSuccess();
    } catch (e) {
      if (onError) onError(e as Error);
    }
  };

  return <Button onClick={handleClick}>Handoff to {agentId}</Button>;
};
