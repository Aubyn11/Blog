import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, User, Eye, Heart, Tag, Search } from 'lucide-react'
import { Post } from '../../types'
import { postService } from '../../services/api'

const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [search, selectedTag])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await postService.getPosts({
        page: 1,
        limit: 12,
        search: search || undefined,
        tag: selectedTag || undefined
      })
      setPosts(response.data)
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

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
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
      )}
    </div>
  )
}

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const postData = await postService.getPost(id!)
      setPost(postData)
    } catch (error) {
      console.error('Failed to fetch post:', error)
    } finally {
      setLoading(false)
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
            <Heart className="w-4 h-4 mr-2" />
            <span>{post.likes} 点赞</span>
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
            className="w-full h-64 md:h-96 object-cover rounded-lg"
          />
        </div>
      )}

      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

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