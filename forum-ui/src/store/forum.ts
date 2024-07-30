import { create } from 'zustand'
import { ServiceApi } from '@dartfrog/puddle'

export interface ForumPost {
  id: string
  title: string
  text_contents: string
  link?: string
  image_url?: string
  author?: string
  upvotes: number
  downvotes: number
  comments: ForumComment[]
  created_at: number
  is_sticky: boolean
}

export interface ForumComment {
  id: string
  post_id: string
  author?: string // Optional, as it might be excluded for privacy
  text: string
  created_at: number
  upvotes: number
  downvotes: number
}

export interface ForumStore {
  posts: ForumPost[]
  title: string
  description: string
  bannedUsers: string[]
  createPost: (api: ServiceApi, post: Omit<ForumPost, 'id' | 'author' | 'upvotes' | 'downvotes' | 'comments' | 'created_at' | 'is_sticky'>) => void
  createStickyPost: (api: ServiceApi, post: Omit<ForumPost, 'id' | 'author' | 'upvotes' | 'downvotes' | 'comments' | 'created_at' | 'is_sticky'>) => void
  vote: (api: ServiceApi, postId: string, isUpvote: boolean) => void
  createComment: (api: ServiceApi, postId: string, text: string) => void
  voteComment: (api: ServiceApi, postId: string, commentId: string, isUpvote: boolean) => void
  deleteComment: (api: ServiceApi, postId: string, commentId: string) => void
  getPost: (api: ServiceApi, postId: string) => void
  updateMetadata: (api: ServiceApi, title?: string, description?: string) => void
  banUser: (api: ServiceApi, user: string) => void
  unbanUser: (api: ServiceApi, user: string) => void
  deletePost: (api: ServiceApi, postId: string) => void
  toggleSticky: (api: ServiceApi, postId: string) => void
  handleUpdate: (update: ForumUpdate) => void
  get: () => ForumStore
  set: (partial: ForumStore | Partial<ForumStore>) => void
}

export type ForumUpdate =
  | { TopPosts: ForumPost[] }
  | { NewPost: ForumPost }
  | { UpdatedPost: ForumPost }
  | { NewComment: ForumComment }
  | { UpdatedComment: { post_id: string, comment: ForumComment } }
  | { DeletedComment: { post_id: string, comment_id: string } }
  | { Metadata: { title: string, description: string } }
  | { BannedUsers: string[] }
  | { DeletedPost: string }

const useForumStore = create<ForumStore>((set, get) => ({
  posts: [],
  title: '',
  description: '',
  bannedUsers: [],

  createPost: (api, post) => {
    const req = {
      Forum: {
        CreatePost: {
          title: post.title,
          text_contents: post.text_contents,
          link: post.link,
          image_url: post.image_url,
        },
      },
    }
    api.sendToService(req)
  },

  createStickyPost: (api, post) => {
    const req = {
      Forum: {
        CreateStickyPost: {
          title: post.title,
          text_contents: post.text_contents,
          link: post.link,
          image_url: post.image_url,
        },
      },
    }
    api.sendToService(req)
  },

  vote: (api, postId, isUpvote) => {
    const req = {
      Forum: {
        Vote: {
          post_id: postId,
          is_upvote: isUpvote,
        },
      },
    }
    api.sendToService(req)
  },

  createComment: (api, postId, text) => {
    const req = {
      Forum: {
        CreateComment: {
          post_id: postId,
          text,
        },
      },
    }
    api.sendToService(req)
  },

  voteComment: (api, postId, commentId, isUpvote) => {
    const req = {
      Forum: {
        VoteComment: {
          post_id: postId,
          comment_id: commentId,
          is_upvote: isUpvote,
        },
      },
    }
    api.sendToService(req)
  },

  deleteComment: (api, postId, commentId) => {
    const req = {
      Forum: {
        DeleteComment: {
          post_id: postId,
          comment_id: commentId,
        },
      },
    }
    api.sendToService(req)
  },

  getPost: (api, postId) => {
    const req = {
      Forum: {
        GetPost: {
          post_id: postId,
        },
      },
    }
    api.sendToService(req)
  },

  updateMetadata: (api, title, description) => {
    const req = {
      Forum: {
        UpdateMetadata: {
          title,
          description,
        },
      },
    }
    api.sendToService(req)
  },

  banUser: (api, user) => {
    const req = {
      Forum: {
        BanUser: {
          user,
        },
      },
    }
    api.sendToService(req)
  },

  unbanUser: (api, user) => {
    const req = {
      Forum: {
        UnbanUser: {
          user,
        },
      },
    }
    api.sendToService(req)
  },

  deletePost: (api, postId) => {
    const req = {
      Forum: {
        DeletePost: {
          post_id: postId,
        },
      },
    }
    api.sendToService(req)
  },

  toggleSticky: (api, postId) => {
    const req = {
      Forum: {
        ToggleSticky: {
          post_id: postId,
        },
      },
    }
    api.sendToService(req)
  },

  handleUpdate: (update: ForumUpdate) => {
    set((state) => {
      if ('TopPosts' in update) {
        return { posts: update.TopPosts }
      } else if ('NewPost' in update) {
        // Sort posts to ensure sticky posts are at the top
        const updatedPosts = [...state.posts, update.NewPost].sort((a, b) => {
          if (a.is_sticky === b.is_sticky) {
            return b.created_at - a.created_at
          }
          return a.is_sticky ? -1 : 1
        })
        return { posts: updatedPosts }
      } else if ('UpdatedPost' in update) {
        const updatedPosts = state.posts.map(post =>
          post.id === update.UpdatedPost.id ? update.UpdatedPost : post
        ).sort((a, b) => {
          if (a.is_sticky === b.is_sticky) {
            return b.created_at - a.created_at
          }
          return a.is_sticky ? -1 : 1
        })
        return { posts: updatedPosts }
      } else if ('NewComment' in update) {
        const updatedPosts = state.posts.map(post => {
          if (post.id === update.NewComment.post_id) {
            return {
              ...post,
              comments: [...post.comments, update.NewComment]
            }
          }
          return post
        })
        return { posts: updatedPosts }
      } else if ('UpdatedComment' in update) {
        const updatedPosts = state.posts.map(post => {
          if (post.id === update.UpdatedComment.post_id) {
            return {
              ...post,
              comments: post.comments.map(comment =>
                comment.id === update.UpdatedComment.comment.id
                  ? update.UpdatedComment.comment
                  : comment
              )
            }
          }
          return post
        })
        return { posts: updatedPosts }
      } else if ('DeletedComment' in update) {
        const updatedPosts = state.posts.map(post => {
          if (post.id === update.DeletedComment.post_id) {
            return {
              ...post,
              comments: post.comments.filter(comment => comment.id !== update.DeletedComment.comment_id)
            }
          }
          return post
        })
        return { posts: updatedPosts }
      } else if ('Metadata' in update) {
        return {
          title: update.Metadata.title,
          description: update.Metadata.description,
        }
      } else if ('BannedUsers' in update) {
        return { bannedUsers: update.BannedUsers }
      } else if ('DeletedPost' in update) {
        return { posts: state.posts.filter(post => post.id !== update.DeletedPost) }
      }
      return state
    })
  },

  get,
  set,
}))

export default useForumStore