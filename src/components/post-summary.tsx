'use client'

import Link from 'next/link'
import { summarize } from '~/server/summary'
import { type RouterOutputs } from '~/trpc/shared'
import { Banner } from '~/components/banner'
import { POSTS_PER_PAGE, classNames } from '~/utils/core'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { AuthorWithDate } from '~/components/author-with-date'
import { HtmlView } from '~/components/html-view'
import ChevronRightIcon from '~/components/svg/chevron-right-icon'
import MessageIcon from '~/components/svg/message-icon'

import { ReactionButton } from './reaction-button'
import { useMemo } from 'react'

export type PostSummaryProps = {
  post: RouterOutputs['post']['feed']['posts'][number]
  hideAuthor?: boolean
  onLike: () => void
  onUnlike: () => void
}

export const getFeedPagination = ({
  authorId,
  currentPageNumber,
}: {
  authorId?: string
  currentPageNumber?: number
}) => {
  return {
    take: POSTS_PER_PAGE,
    skip:
      currentPageNumber === 1
        ? undefined
        : POSTS_PER_PAGE * (currentPageNumber ?? 1 - 1),
    authorId,
  }
}

export const PostSummary = ({
  post,
  hideAuthor,
  onLike,
  onUnlike,
}: PostSummaryProps) => {
  const { summary, hasMore } = useMemo(
    () => summarize(post.contentHtml),
    [post.contentHtml],
  )

  return (
    <div>
      {post.hidden && (
        <Banner className="mb-6">
          This post has been hidden and is only visible to administrators.
        </Banner>
      )}
      <div
        className={classNames({
          'opacity-50': post.hidden,
        })}
      >
        <Link href={`/post/${post.id}`}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {post.title}
          </h2>
        </Link>

        <div className={classNames(hideAuthor ? 'mt-2' : 'mt-6')}>
          {hideAuthor ? (
            <p className="tracking-tight text-secondary">
              <time dateTime={post.createdAt.toISOString()}>
                {formatDistanceToNow(post.createdAt)}
              </time>{' '}
              ago
            </p>
          ) : (
            <AuthorWithDate author={post.author} date={post.createdAt} />
          )}
        </div>

        <HtmlView html={summary} className={hideAuthor ? 'mt-4' : 'mt-6'} />

        <div className="flex items-center gap-4 mt-4 clear-both">
          {hasMore && (
            <Link
              href={`/post/${post.id}`}
              className="inline-flex items-center font-medium transition-colors text-blue"
            >
              Continue reading <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Link>
          )}
          <div className="ml-auto flex gap-6">
            <ReactionButton
              onLike={onLike}
              onUnlike={onUnlike}
              likedBy={post.likedBy}
            />

            <Link
              href={`/post/${post.id}#comments`}
              className="inline-flex items-center gap-1.5"
            >
              <MessageIcon className="w-4 h-4 text-secondary" />
              <span className="ml-1.5">{post._count.comments}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
