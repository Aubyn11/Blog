import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom'
import { Calendar, User, Eye, Heart, Tag, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { marked } from 'marked'
import * as DOMPurify from 'dompurify'

// DOMPurify 兼容包装（支持 ESM 和 CJS 两种导入方式）
const purify = (DOMPurify as any).default ?? DOMPurify
import { Post } from '../../types'
import { postService } from '../../services/api'
import CommentSection from '../../components/CommentSection/CommentSection'

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

// 安全渲染 Markdown 内容
const renderMarkdown = (content: string): string => {
  try {
    const html = marked.parse(content) as string
    return purify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1','h2','h3','h4','h5','h6','p','br','strong','em','del','code','pre',
        'blockquote','ul','ol','li','a','img','table','thead','tbody','tr','th','td',
        'hr','div','span'
      ],
      ALLOWED_ATTR: ['href','src','alt','title','class','target','rel'],
    })
  } catch {
    return purify.sanitize(content)
  }
}

const POSTS_PER_PAGE = 9

const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const tagsRef = useRef<HTMLDivElement>(null)

  // 初始化时读取 URL 参数
  useEffect(() => {
    const tagParam = searchParams.get('tag')
    if (tagParam) setSelectedTag(tagParam)
    // 如果是来自分类标签快捷入口，滚动到标签区域
    if (location.hash === '#tags') {
      setTimeout(() => tagsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedTag])

  useEffect(() => {
    fetchPosts()
  }, [search, selectedTag, currentPage])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      // 支持 URL 中的 userId 和 sort 参数
      const userId = searchParams.get('userId') || undefined
      const sort = searchParams.get('sort') || undefined
      const response = await postService.getPosts({
        page: currentPage,
        limit: POSTS_PER_PAGE,
        search: search || undefined,
        tag: selectedTag || undefined,
        userId,
        sort,
      } as any)
      setPosts(response.data)
      if (response.totalPages) {
        setTotalPages(response.totalPages)
        setTotal(response.total || response.data.length)
      } else {
        setTotalPages(1)
        setTotal(response.data.length)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const allTags = Array.from(new Set(posts.flatMap(post => post.tags)))

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">博客文章</h1>
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索文章..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="">所有标签</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Tags 区域，支持锁定到此处 */}
        <div ref={tagsRef} id="tags" className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedTag('')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedTag === ''
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedTag === tag
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文章</h3>
          <p className="text-gray-500">还没有发布任何博客文章</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <Link
                key={post._id}
                to={`/blog/${post._id}`}
                className="card p-6 hover:shadow-md transition-shadow duration-200"
              >
                {post.coverImage && (
                  <div className="mb-4">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      <span>{post.author.username}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>{post.views}</span>
                    </div>
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      <span>{post.likes}</span>
                    </div>
                  </div>
                </div>
                
                {post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary-100 text-primary-800"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* 分页组件 */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                上一页
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // 显示首页、末页、当前页及其前后各1页
                    return page === 1 || page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                  })
                  .reduce<(number | '...')[]>((acc, page, idx, arr) => {
                    if (idx > 0 && (page as number) - (arr[idx - 1] as number) > 1) {
                      acc.push('...')
                    }
                    acc.push(page)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item as number)}
                        className={`w-9 h-9 text-sm font-medium rounded-md border transition-colors ${
                          currentPage === item
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一页
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}

          {/* 文章总数提示 */}
          <p className="mt-4 text-center text-sm text-gray-400">
            共 {total} 篇文章，第 {currentPage} / {totalPages} 页
          </p>
        </>
      )}
    </div>
  )
}

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPost()
      // 从 localStorage 读取本地点赞状态
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')
      setLiked(likedPosts.includes(id))
    }
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const postData = await postService.getPost(id!)
      setPost(postData)
      setLikeCount(typeof postData.likes === 'number' ? postData.likes : (postData.likes as any)?.length || 0)
    } catch (error) {
      console.error('Failed to fetch post:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (liking || !id) return
    setLiking(true)
    try {
      const result = await postService.likePost(id)
      const newLiked = (result as any).liked ?? !liked
      const newCount = (result as any).likes ?? (newLiked ? likeCount + 1 : Math.max(0, likeCount - 1))
      setLiked(newLiked)
      setLikeCount(newCount)
      // 将点赞状态存入 localStorage
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')
      if (newLiked) {
        localStorage.setItem('likedPosts', JSON.stringify([...new Set([...likedPosts, id])]))
      } else {
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts.filter((pid: string) => pid !== id)))
      }
    } catch (error) {
      console.error('Like failed:', error)
    } finally {
      setLiking(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">文章未找到</h1>
        <Link to="/blog" className="text-primary-600 hover:text-primary-700">
          返回博客列表
        </Link>
      </div>
    )
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center text-sm text-gray-500 mb-4">
          <div className="flex items-center mr-6 mb-2">
            <User className="w-4 h-4 mr-2" />
            <span>{post.author.username}</span>
          </div>
          <div className="flex items-center mr-6 mb-2">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center mr-6 mb-2">
            <Eye className="w-4 h-4 mr-2" />
            <span>{post.views} 阅读</span>
          </div>
          <div className="flex items-center mb-2">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                liked
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{likeCount} 点赞</span>
            </button>
          </div>
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {post.coverImage && (
        <div className="mb-8">
          <img
            src={post.coverImage}
            alt={post.title}
            loading="lazy"
            className="w-full h-64 md:h-96 object-cover rounded-lg"
          />
        </div>
      )}

      {/* 安全渲染 Markdown 内容 */}
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />

      {/* 评论区 */}
      <CommentSection postId={post._id} />

      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link
          to="/blog"
          className="inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          ← 返回博客列表
        </Link>
      </div>
    </article>
  )
}

const Blog: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  
  return id ? <BlogDetail /> : <BlogList />
}

export default Blog