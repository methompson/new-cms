import { BlogPost } from '@dataTypes';

interface BlogController {
  getBlogPostBySlug: (slug: string) => Promise<BlogPost | null>
  getBlogPostById: (id: number) => Promise<BlogPost |  null>
}

export default BlogController;