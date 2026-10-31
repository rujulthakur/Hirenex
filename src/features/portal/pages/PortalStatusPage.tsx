import { Link, useParams } from 'react-router-dom';
import { Check, Minus, UserCheck } from 'lucide-react';
import { Badge, Card, ErrorState, InlineAlert, Skeleton } from '@/components/ui';
import { StageBadge } from '@/components/domain';
import { copy } from '@/lib/copy';
import { PortalExpired } from '../components/PortalExpired';
import { PortalLayout } from '../components/PortalLayout';
import { isExpired, usePortalStatus } from '../hooks/usePortal';

function SkillList({ title, skills, empty, tone }: { title: string; skills: string[]; empty: string; tone: 'matched' | 'missing' }) {
  const Icon = tone === 'matched' ? Check : Minus;
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h2 className="text-md font-semibold">{title}</h2>
      {skills.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <li key={s}>
              <Badge tone={tone === 'matched' ? 'success' : 'neutral'} outline={tone === 'matched' ? 'solid' : 'dashed'}>
                <Icon aria-hidden="true" strokeWidth={1.5} className="h-3 w-3" />
                {s}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {tone === 'missing' && skills.length > 0 ? <p className="text-xs text-muted">{copy.portal.missingNote}</p> : null}
    </section>
  );
}

/** /c/:token/status. Plain-language matched and missing skills, human-review line, next steps. */
export default function PortalStatusPage() {
  const { token = '' } = useParams();
  const q = usePortalStatus(token);
  const p = copy.portal;

  let body: JSX.Element;
  if (q.isLoading) {
    body = (
      <div role="status" aria-busy="true" aria-label={copy.common.loading} className="flex flex-col gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="text" lines={4} />
      </div>
    );
  } else if (q.isError) {
    body = isExpired(q.error) ? <PortalExpired /> : <ErrorState message={p.statusFailed} onRetry={() => void q.refetch()} />;
  } else if (q.data) {
    const d = q.data;
    const mailto = `mailto:${p.askReviewMail}?subject=${encodeURIComponent(p.askReviewSubject)}`;
    body = (
      <>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{p.statusTitle}</h1>
          <p className="text-base text-muted">{p.statusIntro}</p>
          <div className="self-start"><StageBadge stage={d.stage} /></div>
        </div>
        <Card surface={1} className="flex flex-col gap-5">
          <SkillList title={p.matched} skills={d.matchedSkills} empty={p.noneMatched} tone="matched" />
          <SkillList title={p.missing} skills={d.missingSkills} empty={p.noneMissing} tone="missing" />
        </Card>
        <InlineAlert tone={d.humanReviewed ? 'success' : 'info'}>
          <span className="inline-flex items-center gap-2">
            <UserCheck aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
            {d.humanReviewed ? p.humanYes : p.humanNo}
          </span>
        </InlineAlert>
        <section aria-labelledby="next-h" className="flex flex-col gap-2">
          <h2 id="next-h" className="text-md font-semibold">{p.nextSteps}</h2>
          <p className="text-base">{d.nextSteps}</p>
        </section>
        <div className="flex flex-col gap-1">
          <a
            href={mailto}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-base font-medium text-primary-fg hover:brightness-110 focus-visible:shadow-focus"
          >
            {p.askReview}
          </a>
          <p className="text-center text-xs text-muted">{p.askReviewHint}</p>
        </div>
        <Link
          to={`/c/${token}`}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-base text-text hover:bg-surface-2 focus-visible:shadow-focus"
        >
          {p.backToInterview}
        </Link>
      </>
    );
  } else {
    body = <PortalExpired />;
  }

  return <PortalLayout title={copy.pages.portalStatus}>{body}</PortalLayout>;
}
