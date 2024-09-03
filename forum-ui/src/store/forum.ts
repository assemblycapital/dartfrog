import { create } from 'zustand'
import { ServiceApi } from '@dartfrog/puddle'

export interface ForumPost {
  id: number
  title: string
  text_contents: string
  link?: string
  image_url?: string
  author?: string
  authorRequested?: boolean
  upvotes: number
  downvotes: number
  comments: number[]
  created_at: number
  is_sticky: boolean
  is_anon: boolean
  thread_id?: number
}

export interface ForumStore {
  posts: ForumPost[]
  title: string
  description: string
  bannedUsers: string[]
  createPost: (api: ServiceApi, post: Omit<ForumPost, 'id' | 'author' | 'upvotes' | 'downvotes' | 'comments' | 'created_at' | 'is_sticky'>) => void
  createStickyPost: (api: ServiceApi, post: Omit<ForumPost, 'id' | 'author' | 'upvotes' | 'downvotes' | 'comments' | 'created_at' | 'is_sticky' | 'thread_id'>) => void
  vote: (api: ServiceApi, postId: number, isUpvote: boolean) => void
  createComment: (api: ServiceApi, threadId: number, text: string, imageUrl: string, isAnonymous: boolean) => void
  deletePost: (api: ServiceApi, postId: number) => void
  getPost: (api: ServiceApi, postId: number) => void
  updateMetadata: (api: ServiceApi, title?: string, description?: string) => void
  banUser: (api: ServiceApi, user: string) => void
  unbanUser: (api: ServiceApi, user: string) => void
  toggleSticky: (api: ServiceApi, postId: number) => void
  handleUpdate: (update: ForumUpdate) => void
  get: () => ForumStore
  set: (partial: ForumStore | Partial<ForumStore>) => void
  getPostAuthor: (api: ServiceApi, postId: number) => void
}

export type ForumUpdate =
  | { TopPosts: ForumPost[] }
  | { NewPost: ForumPost }
  | { UpdatedPost: ForumPost }
  | { Metadata: { title: string, description: string } }
  | { BannedUsers: string[] }
  | { DeletedPost: number }
  | { PostAuthor: { post_id: number, author: string } }

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
          is_anon: post.is_anon,
          thread_id: post.thread_id,
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
          is_anon: post.is_anon,
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

  createComment: (api, threadId, text, imageUrl, isAnonymous) => {
    const req = {
      Forum: {
        CreatePost: {
          title: '',
          text_contents: text,
          image_url: imageUrl,
          is_anon: isAnonymous,
          thread_id: threadId,
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

  getPostAuthor: (api, postId) => {
    const req = {
      Forum: {
        GetPostAuthor: {
          post_id: postId,
        },
      },
    }
    api.sendToService(req)
    // Mark the author as requested
    set((state) => ({
      posts: state.posts.map(post => 
        post.id === postId ? { ...post, authorRequested: true } : post
      )
    }))
  },

  handleUpdate: (update: ForumUpdate) => {
    set((state) => {
      if ('TopPosts' in update) {
        return { posts: update.TopPosts }
      } else if ('NewPost' in update) {
        const updatedPosts = [...state.posts, update.NewPost].sort((a, b) => {
          if (a.is_sticky === b.is_sticky) {
            return b.created_at - a.created_at
          }
          return a.is_sticky ? -1 : 1
        })
        return { posts: updatedPosts }
      } else if ('UpdatedPost' in update) {
        let updatedPosts = state.posts;
        const existingPostIndex = state.posts.findIndex(post => post.id === update.UpdatedPost.id);
        
        if (existingPostIndex !== -1) {
          // Update existing post
          updatedPosts = state.posts.map(post =>
            post.id === update.UpdatedPost.id ? update.UpdatedPost : post
          );
        } else {
          // Insert new post
          updatedPosts = [...state.posts, update.UpdatedPost];
        }
        
        // Sort the posts
        updatedPosts.sort((a, b) => {
          if (a.is_sticky === b.is_sticky) {
            return b.created_at - a.created_at;
          }
          return a.is_sticky ? -1 : 1;
        });
        
        return { posts: updatedPosts };
      } else if ('Metadata' in update) {
        return {
          title: update.Metadata.title,
          description: update.Metadata.description,
        }
      } else if ('BannedUsers' in update) {
        return { bannedUsers: update.BannedUsers }
      } else if ('DeletedPost' in update) {
        return { posts: state.posts.filter(post => post.id !== update.DeletedPost) }
      } else if ('PostAuthor' in update) {
        return {
          posts: state.posts.map(post => 
            post.id === update.PostAuthor.post_id
              ? { ...post, author: update.PostAuthor.author }
              : post
          )
        }
      }
      return state
    })
  },

  get,
  set,
}))

export default useForumStore