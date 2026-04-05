import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

async function testConnection() {
  console.log('🔍 开始测试数据库连接...')
  console.log('📝 连接字符串:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@') : '未设置')
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ 错误: 未设置 MONGODB_URI 环境变量')
    console.log('💡 请在 backend/.env 文件中配置 MONGODB_URI')
    return
  }

  try {
    // 设置连接选项
    const options = {
      serverSelectionTimeoutMS: 5000, // 5秒超时
      socketTimeoutMS: 45000, // 45秒socket超时
      connectTimeoutMS: 10000, // 10秒连接超时
    }

    console.log('🔌 尝试连接数据库...')
    
    await mongoose.connect(process.env.MONGODB_URI, options)
    
    console.log('✅ 数据库连接成功!')
    
    // 获取数据库信息
    const db = mongoose.connection.db
    const adminDb = db.admin()
    
    // 获取服务器信息
    const serverStatus = await adminDb.serverStatus()
    console.log('📊 MongoDB版本:', serverStatus.version)
    console.log('🏠 主机:', serverStatus.host)
    
    // 列出所有集合
    const collections = await db.listCollections().toArray()
    console.log('📁 现有集合数量:', collections.length)
    
    if (collections.length > 0) {
      console.log('📋 集合列表:')
      collections.forEach(collection => {
        console.log(`   - ${collection.name}`)
      })
    } else {
      console.log('💡 数据库为空，将自动创建集合')
    }
    
    // 测试基本CRUD操作
    console.log('🧪 测试基本操作...')
    
    const testCollection = db.collection('connection_test')
    
    // 插入测试数据
    const testDoc = {
      message: '连接测试',
      timestamp: new Date(),
      status: 'success'
    }
    
    const insertResult = await testCollection.insertOne(testDoc)
    console.log('✅ 插入测试: 成功')
    
    // 查询测试数据
    const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId })
    console.log('✅ 查询测试: 成功')
    
    // 删除测试数据
    await testCollection.deleteOne({ _id: insertResult.insertedId })
    console.log('✅ 删除测试: 成功')
    
    console.log('🎉 所有测试通过!')
    
  } catch (error) {
    console.error('❌ 数据库连接失败:')
    console.error('   错误信息:', error.message)
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 可能的原因:')
      console.error('   - 网络连接问题')
      console.error('   - 数据库服务未启动')
      console.error('   - 连接字符串错误')
      console.error('   - IP地址未加入白名单')
    } else if (error.name === 'MongoNetworkError') {
      console.error('💡 可能的原因:')
      console.error('   - 网络超时')
      console.error('   - 防火墙阻止')
      console.error('   - DNS解析问题')
    } else if (error.name === 'MongoParseError') {
      console.error('💡 可能的原因:')
      console.error('   - 连接字符串格式错误')
      console.error('   - 缺少必要的参数')
    }
    
    console.log('🔧 建议的解决方案:')
    console.log('   1. 检查 MONGODB_URI 环境变量')
    console.log('   2. 验证数据库服务状态')
    console.log('   3. 检查网络连接')
    console.log('   4. 查看云数据库控制台的白名单设置')
    
  } finally {
    // 关闭连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close()
      console.log('🔌 数据库连接已关闭')
    }
  }
}

// 运行测试
testConnection()
  .then(() => {
    console.log('\n🏁 测试完成')
    process.exit(0)
  })
  .catch(error => {
    console.error('测试过程中发生错误:', error)
    process.exit(1)
  })