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
}

export interface ForumComment {
  id: string
  post_id: string
  author: string
  text: string
  created_at: number
}

export interface ForumStore {
  posts: ForumPost[]
  title: string
  description: string
  createPost: (api: ServiceApi, post: Omit<ForumPost, 'id' | 'author' | 'upvotes' | 'downvotes' | 'comments' | 'created_at'>) => void
  vote: (api: ServiceApi, postId: string, isUpvote: boolean) => void
  createComment: (api: ServiceApi, postId: string, text: string) => void
  getPost: (api: ServiceApi, postId: string) => void
  updateMetadata: (api: ServiceApi, title?: string, description?: string) => void
  banUser: (api: ServiceApi, user: string) => void
  unbanUser: (api: ServiceApi, user: string) => void
  handleUpdate: (update: ForumUpdate) => void
  get: () => ForumStore
  set: (partial: ForumStore | Partial<ForumStore>) => void
}

export type ForumUpdate =
  | { TopPosts: ForumPost[] }
  | { NewPost: ForumPost }
  | { UpdatedPost: ForumPost }
  | { NewComment: ForumComment }
  | { Metadata: { title: string, description: string } }

const useForumStore = create<ForumStore>((set, get) => ({
  posts: [],
  title: '',
  description: '',

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

  handleUpdate: (update: ForumUpdate) => {
    set((state) => {
      if ('TopPosts' in update) {
        return { posts: update.TopPosts }
      } else if ('NewPost' in update) {
        return { posts: [...state.posts, update.NewPost] }
      } else if ('UpdatedPost' in update) {
        const updatedPosts = state.posts.map(post =>
          post.id === update.UpdatedPost.id ? update.UpdatedPost : post
        )
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
      } else if ('Metadata' in update) {
        return {
          title: update.Metadata.title,
          description: update.Metadata.description,
        }
      }
      return state
    })
  },

  get,
  set,
}))

export default useForumStore