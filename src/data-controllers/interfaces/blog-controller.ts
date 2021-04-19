import { BlogPost, NewBlogPost } from '@dataTypes';

interface BlogController {
  getBlogPosts: (pagination: number, page: number, admin?: boolean) => Promise<BlogPost[]>;
  getBlogPostBySlug: (slug: string) => Promise<BlogPost>;
  getBlogPostById: (id: string) => Promise<BlogPost>;

  addBlogPost: (blogPost: NewBlogPost) => Promise<BlogPost>;
  editBlogPost: (blogPost: BlogPost) => Promise<BlogPost>;
  deleteBlogPost: (id: string) => Promise<void>;
}

export default BlogController;