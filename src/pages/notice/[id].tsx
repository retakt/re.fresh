import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { getNoticeById, TAG_COLORS } from '@/config/notices';
import { NoticeShareButton } from '@/components/notices/NoticeShareButton';
import { PageMeta } from '@/components/seo/page-meta';
import { cn } from '@/lib/utils';
import './notice-page.css';

// ══════════════════════════════════════════════════════════════════════════════
// Notice Page - Standalone shareable card view (TermsDialog Style)
// ══════════════════════════════════════════════════════════════════════════════

export default function NoticePage() {
  const { id } = useParams<{ id: string }>();
  const notice = id ? getNoticeById(id) : null;

  if (!notice) {
    return (
      <div className="notice-page">
        <PageMeta 
          title="Notice Not Found"
          description="This notice could not be found."
        />
        <div className="notice-card-large">
          <h1 className="text-xl font-semibold dark:text-white text-gray-900 mb-4">
            Notice Not Found
          </h1>
          <p className="text-sm dark:text-white/70 text-gray-600 mb-6">
            This notice doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium dark:text-white text-gray-900 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={16} />
            Back to re.Takt
          </Link>
        </div>
      </div>
    );
  }

  const tagColor = TAG_COLORS[notice.tag];

  return (
    <div className="notice-page">
      <PageMeta 
        title={notice.title}
        description={notice.body}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="notice-card-large"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b dark:border-white/10 border-black/10">
          <div className="flex items-center gap-3">
            {/* Tag */}
            <div 
              className="inline-block px-2.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider font-mono"
              style={{
                backgroundColor: tagColor.bg,
                color: tagColor.text,
                border: `1px solid ${tagColor.border}`
              }}
            >
              {notice.tag}
            </div>
            <span className="text-[12px] dark:text-white/50 text-gray-500 font-mono">
              {notice.date}
            </span>
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5"
        >
          {/* Title */}
          <h1 className="text-2xl font-semibold leading-tight dark:text-white text-gray-900">
            {notice.title}
          </h1>

          {/* Body */}
          <div className="space-y-4">
            <p className="text-[15px] leading-relaxed dark:text-white/80 text-gray-700">
              {notice.body}
            </p>

            {/* Link CTA */}
            {notice.link && (
              <a
                href={notice.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                  "text-[14px] font-medium transition-colors",
                  "dark:bg-white/10 dark:hover:bg-white/15 dark:text-white",
                  "bg-gray-900/10 hover:bg-gray-900/15 text-gray-900",
                  "border border-white/10"
                )}
              >
                {notice.link.text}
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t dark:border-white/10 border-black/10">
          <NoticeShareButton noticeId={notice.id} />
          
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium dark:text-white/70 dark:hover:text-white text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to re.Takt
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
