import { BlogPost } from '../../data-types';

interface BlogController {
  getBlogPostBySlug: (slug: string) => Promise<BlogPost> | Promise<null>
  getBlogPostById: (id: number) => Promise<BlogPost> | Promise<null>
}

export default BlogController;