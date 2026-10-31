import { useState } from 'react';
import { Badge, Button, Card, Input, Textarea } from '@/components/ui';
import { copy } from '@/lib/copy';

interface Props {
  to: string; subject: string; body: string;
  personalised?: string[];
  onSave?: (next: { subject: string; body: string }) => void;
}

function renderBody(body: string, fields: string[]) {
  if (fields.length === 0) return body;
  const pattern = new RegExp(`(${fields.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return body.split(pattern).map((part, i) => (fields.includes(part)
    ? <mark key={i} className="rounded-sm bg-surface-2 px-0.5 text-primary">{part}</mark>
    : <span key={i}>{part}</span>));
}

/** Usage: <EmailPreviewCard to="c01@test" subject body personalised={['Candidate 01']} onSave={...} />. */
export function EmailPreviewCard({ to, subject, body, personalised = [], onSave }: Props) {
  const [edit, setEdit] = useState(false);
  const [s, setS] = useState(subject);
  const [b, setB] = useState(body);
  const toggle = () => {
    if (edit) onSave?.({ subject: s, body: b });
    setEdit(!edit);
  };
  return (
    <Card surface={1} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted">{to}</span>
        <div className="flex items-center gap-2">
          <Badge tone="info">{copy.domain.emailTest}</Badge>
          <Button size="sm" variant="outline" onClick={toggle}>{edit ? copy.domain.emailDone : copy.domain.emailEdit}</Button>
        </div>
      </div>
      {edit ? (
        <>
          <Input aria-label={copy.domain.emailSubject} value={s} onChange={(e) => setS(e.target.value)} />
          <Textarea aria-label={copy.domain.emailBody} rows={6} value={b} onChange={(e) => setB(e.target.value)} />
        </>
      ) : (
        <>
          <h3 className="text-md font-semibold">{subject}</h3>
          <p className="whitespace-pre-wrap text-base">{renderBody(body, personalised)}</p>
          {personalised.length > 0 && <p className="text-xs text-muted">{copy.domain.emailPersonalised}</p>}
        </>
      )}
    </Card>
  );
}
