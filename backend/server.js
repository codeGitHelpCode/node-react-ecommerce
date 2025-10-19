import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import config from './config';
import sequelize from './config/database';
import userRoute from './routes/userRoute';
import productRoute from './routes/productRoute';
import orderRoute from './routes/orderRoute';
import uploadRoute from './routes/uploadRoute';

// 导入数据模型建立关联
import Product from './models/productModel';
import User from './models/userModel';
import Order, { OrderItem } from './models/orderModel';

const app = express();

// 数据库连接
sequelize.authenticate()
  .then(() => {
    console.log('成功连接到MySQL数据库！');
    // 同步数据库表结构（开发环境）
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
    console.log('数据库表已同步');
    // 添加测试数据
    await addTestData();
  })
  .catch((error) => {
    console.error('数据库连接失败！', error.message);
    console.error('请检查：');
    console.error('1. MySQL 服务是否正在运行');
    console.error('2. 数据库 ecommerce_db 是否存在');
    console.error('3. 用户名和密码是否正确');
    console.error('4. 端口 3306 是否可访问');
    process.exit(1);
  });

// 添加测试数据的函数
async function addTestData() {
  try {
    // 检查是否已有产品数据
    const productCount = await Product.count();

    if (productCount === 0) {
      console.log('正在添加测试产品数据...');

      const testProducts = [
        {
          name: 'Nike Air Max 270',
          price: 150.00,
          image: '/images/p1.jpg',
          brand: 'Nike',
          category: 'Shoes',
          countInStock: 10,
          description: 'Comfortable running shoes with Air Max technology',
          rating: 4.5,
          numReviews: 12
        },
        {
          name: 'Adidas Ultraboost 22',
          price: 180.00,
          image: '/images/p2.jpg',
          brand: 'Adidas',
          category: 'Shoes',
          countInStock: 8,
          description: 'High-performance running shoes with Boost technology',
          rating: 4.8,
          numReviews: 25
        },
        {
          name: 'Puma RS-X',
          price: 120.00,
          image: '/images/p3.jpg',
          brand: 'Puma',
          category: 'Shoes',
          countInStock: 15,
          description: 'Retro-inspired sneakers with modern comfort',
          rating: 4.2,
          numReviews: 8
        },
        {
          name: 'Nike Dri-FIT T-Shirt',
          price: 25.00,
          image: '/images/d1.jpg',
          brand: 'Nike',
          category: 'Shirts',
          countInStock: 20,
          description: 'Moisture-wicking athletic t-shirt',
          rating: 4.3,
          numReviews: 15
        },
        {
          name: 'Adidas Originals Hoodie',
          price: 65.00,
          image: '/images/d2.jpg',
          brand: 'Adidas',
          category: 'Shirts',
          countInStock: 12,
          description: 'Classic hoodie with three stripes design',
          rating: 4.6,
          numReviews: 18
        },
        {
          name: 'Puma Classic Shorts',
          price: 35.00,
          image: '/images/d3.jpg',
          brand: 'Puma',
          category: 'Shorts',
          countInStock: 25,
          description: 'Comfortable athletic shorts for training',
          rating: 4.1,
          numReviews: 7
        }
      ];

      // 批量创建产品
      await Product.bulkCreate(testProducts);
      console.log('测试产品数据已添加！');
    } else {
      console.log(`数据库中已有 ${productCount} 个产品`);
    }

    // 检查是否已有管理员用户
    const adminCount = await User.count({ where: { isAdmin: true } });

    if (adminCount === 0) {
      console.log('正在添加管理员用户...');

      await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: '1234',
        isAdmin: true
      });

      console.log('管理员用户已创建: admin@example.com / 1234');
    }

  } catch (error) {
    console.error('添加测试数据失败:', error.message);
  }
}

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由
app.use('/api/uploads', uploadRoute);
app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.use('/api/orders', orderRoute);

app.get('/api/config/paypal', (req, res) => {
  res.send(config.PAYPAL_CLIENT_ID);
});

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, '/../uploads')));
app.use(express.static(path.join(__dirname, '/../frontend/build')));

// 前端路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/../frontend/build/index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('服务器内部错误！');
});

// 启动服务器
app.listen(config.PORT, () => {
  console.log(`服务器已启动: http://localhost:${config.PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});