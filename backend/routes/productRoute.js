import express from 'express';
import Product, { Review } from '../models/productModel';
import { isAuth, isAdmin } from '../util';
import { Op } from 'sequelize';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const where = {};
    
    // 分类筛选
    if (req.query.category) {
      where.category = req.query.category;
    }
    
    // 搜索关键词
    if (req.query.searchKeyword) {
      where.name = {
        [Op.like]: `%${req.query.searchKeyword}%`
      };
    }

    // 排序
    let order = [['id', 'DESC']]; // 默认按ID降序
    if (req.query.sortOrder === 'lowest') {
      order = [['price', 'ASC']];
    } else if (req.query.sortOrder === 'highest') {
      order = [['price', 'DESC']];
    }

    const products = await Product.findAll({
      where,
      order,
      include: [{
        model: Review,
        as: 'reviews'
      }],
      raw: false // 确保返回 Sequelize 实例
    });
    
    const formattedProducts = products.map(product => ({
      id: product.id, 
      name: product.name,
      image: product.image,
      brand: product.brand,
      price: product.price,
      category: product.category,
      countInStock: product.countInStock,
      description: product.description,
      rating: product.rating,
      numReviews: product.numReviews,
      reviews: product.reviews || []
    }));
    
    res.send(formattedProducts);
  } catch (error) {
    console.error('获取产品列表失败:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Review,
        as: 'reviews'
      }]
    });
    
    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: 'Product Not Found.' });
    }
  } catch (error) {
    console.error('获取产品详情失败:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.post('/:id/reviews', isAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (product) {
      // 创建新评价
      const review = await Review.create({
        name: req.body.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
        productId: product.id
      });

      // 重新计算平均评分和评价数量
      const reviews = await Review.findAll({
        where: { productId: product.id }
      });
      
      const numReviews = reviews.length;
      const rating = reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews;

      // 更新产品信息
      await product.update({
        numReviews,
        rating: Math.round(rating * 100) / 100 // 保留两位小数
      });

      res.status(201).send({
        data: review,
        message: 'Review saved successfully.',
      });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  } catch (error) {
    console.error('添加评价失败:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.put('/:id', isAuth, isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByPk(productId);
    
    if (product) {
      await product.update({
        name: req.body.name,
        price: req.body.price,
        image: req.body.image,
        brand: req.body.brand,
        category: req.body.category,
        countInStock: req.body.countInStock,
        description: req.body.description,
      });
      
      res.status(200).send({ 
        message: 'Product Updated', 
        data: product 
      });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  } catch (error) {
    console.error('更新产品失败:', error.message);
    res.status(500).send({ message: 'Error in Updating Product.' });
  }
});

router.delete('/:id', isAuth, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (product) {
      // 删除相关评价
      await Review.destroy({
        where: { productId: product.id }
      });
      
      // 删除产品
      await product.destroy();
      
      res.send({ message: 'Product Deleted' });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  } catch (error) {
    console.error('删除产品失败:', error.message);
    res.status(500).send({ message: 'Error in Deletion.' });
  }
});

router.post('/', isAuth, isAdmin, async (req, res) => {
  try {
    const product = await Product.create({
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
      brand: req.body.brand,
      category: req.body.category,
      countInStock: req.body.countInStock,
      description: req.body.description,
      rating: req.body.rating || 0,
      numReviews: req.body.numReviews || 0,
    });
    
    res.status(201).send({ 
      message: 'New Product Created', 
      data: product 
    });
  } catch (error) {
    console.error('创建产品失败:', error.message);
    res.status(500).send({ message: 'Error in Creating Product.' });
  }
});

export default router;