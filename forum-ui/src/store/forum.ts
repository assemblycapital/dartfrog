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
  createPost: (api: ServiceApi, post: Omit<ForumPost, 'id' | 'author' | 'upvotes' | 'downvotes' | 'comments' | 'created_at'>) => void
  vote: (api: ServiceApi, postId: string, isUpvote: boolean) => void
  createComment: (api: ServiceApi, postId: string, text: string) => void
  getPost: (api: ServiceApi, postId: string) => void
  handleUpdate: (update: ForumUpdate) => void
  get: () => ForumStore
  set: (partial: ForumStore | Partial<ForumStore>) => void
}

export type ForumUpdate =
  | { AllPosts: ForumPost[] }
  | { NewPost: ForumPost }
  | { UpdatedPost: ForumPost }
  | { NewComment: ForumComment }

const useForumStore = create<ForumStore>((set, get) => ({
  posts: [],

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

  handleUpdate: (update: ForumUpdate) => {
    set((state) => {
      if ('AllPosts' in update) {
        return { posts: update.AllPosts }
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
      }
      return state
    })
  },

  get,
  set,
}))

export default useForumStore