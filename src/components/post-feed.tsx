'use client'

import { api } from '~/trpc/react'
import { PostSummary, getFeedPagination } from './post-summary'
import { Pagination } from './pagination'
import { PostSkeleton } from './post-skeleton'
import { useSession } from 'next-auth/react'

type PostFeedProps = {
  fallbackMessage: string
  currentPageNumber?: number
  authorId?: string
}

export const PostFeed = ({
  fallbackMessage,
  currentPageNumber,
  authorId,
}: PostFeedProps) => {
  const { data, isLoading } = api.post.feed.useQuery(
    getFeedPagination({ authorId, currentPageNumber }),
  )

  const { like, unlike } = useReaction({ currentPageNumber, authorId })

  if (isLoading) return <PostSkeleton count={3} />

  return (
    <>
      {data?.postCount === 0 ? (
        <div className="text-center text-secondary border rounded py-20 px-10">
          {fallbackMessage}
        </div>
      ) : (
        <>
          <ul className="-my-12 divide-y divide-primary">
            {data?.posts.map((post) => {
              return (
                <li key={post.id} className="py-10">
                  <PostSummary
                    onLike={() => like.mutate({ id: post.id })}
                    onUnlike={() => unlike.mutate({ id: post.id })}
                    post={post}
                  />
                </li>
              )
            })}
          </ul>
          <Pagination
            itemCount={data?.postCount ?? 0}
            currentPageNumber={currentPageNumber ?? 1}
          />
        </>
      )}
    </>
  )
}

const useReaction = ({
  authorId,
  currentPageNumber,
}: {
  authorId?: string
  currentPageNumber?: number
}) => {
  const { data: session } = useSession()

  const utils = api.useUtils()
  const previousQuery = utils.post.feed.getData(
    getFeedPagination({ authorId, currentPageNumber }),
  )

  const like = api.post.like.useMutation({
    onMutate: async ({ id }) => {
      if (previousQuery) {
        utils.post.feed.setData(
          getFeedPagination({ authorId, currentPageNumber }),
          {
            ...previousQuery,
            posts: previousQuery.posts.map((post) =>
              post.id === id
                ? {
                    ...post,
                    likedBy: [
                      ...post.likedBy,
                      {
                        user: {
                          id: session!.user.id,
                          name: session!.user.name,
                        },
                      },
                    ],
                  }
                : post,
            ),
          },
        )
      }
    },
  })

  const unlike = api.post.unlike.useMutation({
    onMutate: async ({ id }) => {
      if (previousQuery) {
        utils.post.feed.setData(
          getFeedPagination({ authorId, currentPageNumber }),
          {
            ...previousQuery,
            posts: previousQuery.posts.map((post) =>
              post.id === id
                ? {
                    ...post,
                    likedBy: post.likedBy.filter(
                      (item) => item.user.id !== session!.user.id,
                    ),
                  }
                : post,
            ),
          },
        )
      }
    },
  })

  return {
    like,
    unlike,
  }
}
