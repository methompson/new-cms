import { BlogPost, NewBlogPost } from '@dataTypes';

interface BlogController {
  getBlogPostBySlug: (slug: string) => Promise<BlogPost | null>
  getBlogPostById: (id: string) => Promise<BlogPost |  null>

  addBlogPost: (blogPost: NewBlogPost) => Promise<BlogPost>
  editBlogPost: (blogPost: BlogPost) => Promise<BlogPost>
  deleteBlogPost: (id: string) => Promise<void>
}

export default BlogController;